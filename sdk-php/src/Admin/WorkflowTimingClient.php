<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\TimePlan\Dto;
use HaakCo\Custd\Admin\TimePlan\Payload;
use HaakCo\Custd\Admin\WorkflowTiming\BatchResult;
use HaakCo\Custd\Admin\WorkflowTiming\Definition;
use HaakCo\Custd\Admin\WorkflowTiming\DurationHistory;
use HaakCo\Custd\Admin\WorkflowTiming\Evaluation;
use HaakCo\Custd\Admin\WorkflowTiming\Observation;
use HaakCo\Custd\Admin\WorkflowTiming\ObservationResult;
use HaakCo\Custd\Admin\WorkflowTiming\ObservedRun;
use HaakCo\Custd\Admin\WorkflowTiming\ReconcileResult;
use HaakCo\Custd\Admin\WorkflowTiming\RunPrediction;
use HaakCo\Custd\Admin\WorkflowTiming\RunSummary;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowDeclaration;

/**
 * WorkflowTimingClient records work another system performed.
 *
 * Custd is not the controller here: the consumer keeps ownership of its own
 * lifecycle and reports the facts it observed after its own commit. Nothing in
 * this client executes, schedules, retries or cancels the consumer's work, and
 * every append is idempotent through the caller's deterministic key.
 */
final class WorkflowTimingClient
{
    private const MAX_BATCH_FACTS = 10000;
    private const MAX_BATCH_BYTES = 1 << 20;

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        private readonly mixed $transport,
    ) {
        $this->token = $token;
    }

    /**
     * reconcile declaratively applies one workflow shape. Repeating an identical
     * declaration is a no-op, and the result says which of the three cases
     * happened: created, revision changed, or nothing changed.
     */
    public function reconcile(string $companySlug, WorkflowDeclaration $declaration): ReconcileResult
    {
        $path = $this->resource("/definitions/{$declaration->workflowKey}", $companySlug);

        return ReconcileResult::fromPayload($this->requiredResponse('PUT', $path, $declaration));
    }

    /** @return list<Definition> */
    public function listDefinitions(string $companySlug, ?int $limit = null): array
    {
        $payload = $this->requiredResponse('GET', $this->collection('/definitions', $companySlug, $limit));
        return array_map(
            static fn (array $item): Definition => Definition::fromPayload($item),
            Payload::objects($payload, 'items'),
        );
    }

    public function getDefinition(string $companySlug, string $workflowKey): Definition
    {
        return Definition::fromPayload(
            $this->requiredResponse('GET', $this->resource("/definitions/{$workflowKey}", $companySlug)),
        );
    }

    /**
     * append records one observed fact. Use the BatchResult::requireAccepted()
     * result rather than the transport status: a rejected item is not an append.
     */
    public function append(string $companySlug, Observation $observation): BatchResult
    {
        $path = $this->collection('/observations', $companySlug);
        return BatchResult::fromPayload(
            $this->requiredResponse('POST', $path, new class ($observation) implements Dto {
                public function __construct(private readonly Observation $observation)
                {
                }

                /** @return array<string, mixed> */
                public function toPayload(): array
                {
                    return ['observation' => $this->observation->toPayload()];
                }
            }),
        );
    }

    /**
     * appendBatch splits imports into requests of at most 10,000 facts and 1 MiB
     * of JSON. Results retain their original input indexes. Each request commits
     * independently; after a transport error, replay the same idempotency keys.
     * Call requireAccepted() to detect item rejections in every chunk.
     *
     * @param list<Observation> $observations
     */
    public function appendBatch(string $companySlug, array $observations): BatchResult
    {
        $chunks = $this->observationChunks($observations);
        $results = [];
        $accepted = $rejected = $duplicates = $offset = 0;
        foreach ($chunks as $chunk) {
            $batch = $this->appendChunk($companySlug, $chunk);
            $this->validateBatchResult($batch, count($chunk));
            foreach ($batch->results as $item) {
                $results[] = new ObservationResult(
                    $item->index + $offset,
                    $item->accepted,
                    $item->duplicate,
                    $item->workflowKey,
                    $item->externalRunId,
                    $item->idempotencyKey,
                    $item->runUuid,
                    $item->factUuid,
                    $item->errorCode,
                    $item->errorMessage,
                );
            }
            $accepted += $batch->accepted;
            $rejected += $batch->rejected;
            $duplicates += $batch->duplicates;
            $offset += count($chunk);
        }
        return new BatchResult($results, $accepted, $rejected, $duplicates);
    }

    /** @param list<Observation> $observations
     *  @return list<list<Observation>>
     */
    private function observationChunks(array $observations): array
    {
        if ($observations === []) {
            throw new \InvalidArgumentException('custd: at least one workflow timing observation is required');
        }
        $envelopeBytes = strlen('{"observations":[]}');
        $chunks = [];
        $start = 0;
        $size = $envelopeBytes;
        foreach ($observations as $index => $observation) {
            $itemBytes = strlen(json_encode($observation->toPayload(), JSON_THROW_ON_ERROR)) + 1;
            if ($envelopeBytes + $itemBytes > self::MAX_BATCH_BYTES) {
                throw new \InvalidArgumentException("custd: workflow timing observation {$index} exceeds the 1 MiB request limit");
            }
            if ($size + $itemBytes > self::MAX_BATCH_BYTES || $index - $start === self::MAX_BATCH_FACTS) {
                $chunks[] = array_slice($observations, $start, $index - $start);
                $start = $index;
                $size = $envelopeBytes;
            }
            $size += $itemBytes;
        }
        $chunks[] = array_slice($observations, $start);
        return $chunks;
    }

    private function validateBatchResult(BatchResult $batch, int $count): void
    {
        $accepted = $rejected = $duplicates = 0;
        foreach ($batch->results as $index => $item) {
            if ($item->index !== $index) {
                throw new \UnexpectedValueException('custd: workflow timing response has invalid item indexes');
            }
            if ($item->accepted) {
                $accepted++;
            } else {
                $rejected++;
            }
            if ($item->duplicate) {
                $duplicates++;
            }
        }
        if (count($batch->results) !== $count || $batch->accepted !== $accepted
            || $batch->rejected !== $rejected || $batch->duplicates !== $duplicates) {
            throw new \UnexpectedValueException('custd: workflow timing response does not account for every input; replay with the same idempotency keys');
        }
    }

    /** @param list<Observation> $observations */
    private function appendChunk(string $companySlug, array $observations): BatchResult
    {
        $path = $this->collection('/observations:batch', $companySlug);
        return BatchResult::fromPayload(
            $this->requiredResponse('POST', $path, new class ($observations) implements Dto {
                /** @param list<Observation> $observations */
                public function __construct(
                    /** @var list<Observation> */
                    private readonly array $observations
                ) {
                }

                /** @return array<string, mixed> */
                public function toPayload(): array
                {
                    return [
                        'observations' => array_map(
                            static fn (Observation $item): array => $item->toPayload(),
                            $this->observations,
                        ),
                    ];
                }
            }),
        );
    }

    /** correct appends a superseding fact for an accepted observation. */
    public function correct(string $companySlug, Observation $observation): BatchResult
    {
        $path = $this->collection('/corrections', $companySlug);
        return BatchResult::fromPayload(
            $this->requiredResponse('POST', $path, new class ($observation) implements Dto {
                public function __construct(private readonly Observation $observation)
                {
                }

                /** @return array<string, mixed> */
                public function toPayload(): array
                {
                    return ['observation' => $this->observation->toPayload()];
                }
            }),
        );
    }

    /**
     * listRuns lists the tenant's observed runs, newest first. A run whose summary
     * reports pending facts has observations that are not folded yet.
     *
     * @return list<RunSummary>
     */
    public function listRuns(string $companySlug, ?int $limit = null): array
    {
        $payload = $this->requiredResponse('GET', $this->collection('/runs', $companySlug, $limit));
        return array_map(
            static fn (array $item): RunSummary => RunSummary::fromPayload($item),
            Payload::objects($payload, 'items'),
        );
    }

    public function getRun(string $companySlug, string $runUuid): ObservedRun
    {
        return ObservedRun::fromPayload(
            $this->requiredResponse('GET', $this->resource("/runs/{$runUuid}", $companySlug)),
        );
    }

    /** prediction reads the evidence-backed completion expectation for one run. */
    public function prediction(string $companySlug, string $runUuid): RunPrediction
    {
        $path = $this->resource("/runs/{$runUuid}/prediction", $companySlug);
        return RunPrediction::fromPayload($this->requiredResponse('GET', $path));
    }

    public function durationHistory(string $companySlug, string $workflowKey, ?int $limit = null): DurationHistory
    {
        $path = $this->resource("/definitions/{$workflowKey}/duration-history", $companySlug, $limit);
        return DurationHistory::fromPayload($this->requiredResponse('GET', $path));
    }

    /**
     * evaluation reads the rolling-origin evaluation of a workflow's duration
     * series. An unavailable result carries the next safe action rather than an
     * unattributed calibration.
     */
    public function evaluation(string $companySlug, string $workflowKey, string $seriesKey = ''): Evaluation
    {
        $query = ['companySlug' => $companySlug];
        if ($seriesKey !== '') {
            $query['seriesKey'] = $seriesKey;
        }
        $path = '/workflow-timings/definitions/' . rawurlencode($workflowKey) . '/evaluation?'
            . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        return Evaluation::fromPayload($this->requiredResponse('GET', $path));
    }

    /** rebuild deterministically rebuilds one run's projections from its ledger. */
    public function rebuild(string $companySlug, string $runUuid): void
    {
        $this->request('POST', $this->resource("/runs/{$runUuid}/rebuild", $companySlug));
    }

    /** @return array<string, mixed>|null */
    private function request(string $method, string $path, ?Dto $body = null): ?array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, $method, $path, $body?->toPayload());
    }

    /** @return array<string, mixed> */
    private function requiredResponse(string $method, string $path, ?Dto $body = null): array
    {
        $response = $this->request($method, $path, $body);
        if ($response === null) {
            throw new \UnexpectedValueException('custd: workflow timing response body is required');
        }
        return $response;
    }

    private function collection(string $path, string $companySlug, ?int $limit = null): string
    {
        $query = ['companySlug' => $companySlug];
        if ($limit !== null) {
            $query['limit'] = $limit;
        }
        return '/workflow-timings' . $path . '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    }

    private function resource(string $path, string $companySlug, ?int $limit = null): string
    {
        $segments = explode('/', $path);
        foreach ($segments as $index => $segment) {
            if ($index > 0) {
                $segments[$index] = rawurlencode($segment);
            }
        }
        return $this->collection(implode('/', $segments), $companySlug, $limit);
    }
}
