<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminWorkflowException;
use HaakCo\Custd\Admin\WorkflowTiming\Observation;
use HaakCo\Custd\Admin\WorkflowTiming\StepDeclaration;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowDeclaration;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowTimingIdempotency;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * These tests read the shared fixtures under contract-fixtures/. The Go façade
 * reads the same bytes and asserts the same values, so a field rename on either
 * side fails here instead of at a consumer.
 */
final class WorkflowTimingClientTest extends TestCase
{
    public function testConformanceDeclaresTheWorkflowShape(): void
    {
        $calls = [];
        $client = $this->client($calls, fn (): array => $this->ok('workflow-timing-definition-reconcile-response.json'));

        $result = $client->adminWorkflowTimings()->reconcile(
            'acme',
            new WorkflowDeclaration(
                workflowKey: 'hosting.reconcile',
                name: 'Hosting reconcile',
                description: 'Observed hosting provisioning phases.',
                dimensions: ['cluster'],
            )->withStep(new StepDeclaration('foundation', 'Foundation', 600000))
                ->withStep(new StepDeclaration('database', 'Database', 900000))
                ->withStep(new StepDeclaration('deploy', 'Deploy', 300000)),
        );

        $this->assertSame('PUT', $calls[0]['method']);
        $this->assertSame(
            '/api/v1/admin/workflow-timings/definitions/hosting.reconcile?companySlug=acme',
            $this->path($calls[0]['url']),
        );
        $this->assertSame('hosting.reconcile', $calls[0]['body']['workflowKey']);
        $this->assertSame('foundation', $calls[0]['body']['steps'][0]['stepKey']);

        $this->assertSame('hosting.reconcile', $result->definition->workflowKey);
        $this->assertFalse($result->created);
        $this->assertTrue($result->revisionChanged);
        $this->assertFalse($result->wasNoOp());
        $this->assertSame(2, $result->definition->revisionCount);
        $revision = $result->definition->currentRevision;
        $this->assertSame(2, $revision->number);
        $this->assertSame(str_repeat('a', 64), $revision->hash);
        $this->assertFalse($revision->allowOverlap);
        $this->assertSame(3, count($revision->steps));
        $deploy = $revision->step('deploy');
        $this->assertNotNull($deploy);
        $this->assertSame(3, $deploy->sequence);
        $this->assertSame(300000, $deploy->nominalMs);
        $this->assertNull($revision->step('absent'));
        $this->assertSame('cluster', $revision->dimensions[0]->dimensionKey);
        $this->assertNotSame('', $revision->predictionVersionUuid);
    }

    public function testConformanceSendsEveryFactShape(): void
    {
        $calls = [];
        $client = $this->client($calls, fn (): array => ['status' => 200, 'body' => json_encode(
            ['results' => [], 'accepted' => 0, 'rejected' => 0, 'duplicates' => 0],
            JSON_THROW_ON_ERROR,
        )]);

        $key = WorkflowTimingIdempotency::stepFinished('hosting.reconcile', 'op-20260922-42', 'foundation', 1);
        $client->adminWorkflowTimings()->append(
            'acme',
            Observation::stepFinished(
                'hosting.reconcile',
                'op-20260922-42',
                '2026-09-22T10:05:00Z',
                $key,
                'foundation',
                'hosting-worker-7',
            )->superseding(str_repeat('0', 8)),
        );

        $body = $calls[0]['body']['observation'];
        $this->assertSame($key, $body['idempotencyKey']);
        $this->assertSame('step_finished', $body['fact']['kind']);
        $this->assertSame('foundation', $body['fact']['step']['stepKey']);
        $this->assertSame('completed', $body['fact']['step']['state']);
        $this->assertSame(str_repeat('0', 8), $body['supersedesFactUuid']);
        $this->assertSame('machine', $body['provenance']['actorKind']);
        $this->assertSame('hosting-worker-7', $body['provenance']['actorRef']);
    }

    public function testConformanceDecodesTheSharedBatchFixture(): void
    {
        $calls = [];
        $client = $this->client($calls, fn (): array => ['status' => 200, 'body' => json_encode(
            ['results' => [], 'accepted' => 0, 'rejected' => 0, 'duplicates' => 0],
            JSON_THROW_ON_ERROR,
        )]);

        $fixture = $this->fixture('workflow-timing-observation-batch-request.json');
        $this->assertCount(4, $fixture['observations']);

        $started = $fixture['observations'][0];
        $this->assertSame('run_started', $started['fact']['kind']);
        $this->assertSame('running', $started['fact']['run']['state']);
        $this->assertSame('fsn1-a', $started['fact']['dimensions']['cluster']);
        $this->assertSame('machine', $started['provenance']['actorKind']);
        $this->assertArrayHasKey('actorRef', $started['provenance']);

        $this->assertSame('timeout', $fixture['observations'][3]['fact']['step']['errorClass']);
        $this->assertNotSame('', $fixture['observations'][3]['supersedesFactUuid']);

        $observations = [];
        foreach ($fixture['observations'] as $observation) {
            $observations[] = Observation::stepFinished(
                $observation['workflowKey'],
                $observation['externalRunId'],
                $observation['fact']['occurredAt'],
                $observation['idempotencyKey'],
                $observation['fact']['step']['stepKey'] ?? 'foundation',
                $observation['provenance']['actorRef'],
            );
        }
        $result = $client->adminWorkflowTimings()->appendBatch('acme', $observations);
        $this->assertSame(0, $result->rejected);
        $this->assertCount(4, $calls[0]['body']['observations']);
        $this->assertSame(
            '/api/v1/admin/workflow-timings/observations:batch?companySlug=acme',
            $this->path($calls[0]['url']),
        );
    }

    public function testConformanceFailsClosedOnAPartialBatch(): void
    {
        $calls = [];
        $client = $this->client($calls, fn (): array => $this->ok('workflow-timing-batch-result-partial.json'));

        $result = $client->adminWorkflowTimings()->appendBatch('acme', [
            Observation::runStarted(
                'hosting.reconcile',
                'op-20260922-42',
                '2026-09-22T10:00:00Z',
                'k0',
                'hosting-worker-7',
            ),
        ]);

        $this->assertSame(2, $result->accepted);
        $this->assertSame(1, $result->rejected);
        $this->assertSame(1, $result->duplicates);
        $this->assertCount(3, $result->results);
        $this->assertSame('hosting.reconcile', $result->results[0]->workflowKey);
        $this->assertSame('workflow_step_unknown', $result->results[1]->errorCode);
        $this->assertTrue($result->results[2]->duplicate);

        $this->expectException(AdminWorkflowException::class);
        $this->expectExceptionMessageMatches('/1 of 3/');
        $result->requireAccepted();
    }

    public function testConformanceReadsARunWithPendingFacts(): void
    {
        $calls = [];
        $client = $this->client($calls, fn (): array => $this->ok('workflow-timing-run-read-response.json'));

        $run = $client->adminWorkflowTimings()->getRun('acme', 'run-1');

        $this->assertSame('running', $run->state);
        $this->assertSame(2, $run->revisionNumber);
        $this->assertSame('fsn1-a', $run->dimensions['cluster']);
        $this->assertCount(2, $run->attempts);
        $foundation = $run->attempt('foundation');
        $this->assertNotNull($foundation);
        $this->assertSame('completed', $foundation->state);
        $this->assertFalse($foundation->isOpen());
        $database = $run->attempt('database');
        $this->assertNotNull($database);
        $this->assertTrue($database->isOpen());
        $this->assertNull($database->finishedAt);
        $this->assertTrue($run->projectionBehind());
        $this->assertSame('rebuild', $run->projectionStatus->nextAction);
        $this->assertSame(
            '/api/v1/admin/workflow-timings/runs/run-1?companySlug=acme',
            $this->path($calls[0]['url']),
        );
    }

    public function testConformanceKeepsColdStartDistinctFromReady(): void
    {
        $coldCalls = [];
        $cold = $this->client($coldCalls, fn (): array => $this->ok('workflow-timing-prediction-cold-start.json'));
        $coldStart = $cold->adminWorkflowTimings()->prediction('acme', 'run-1');

        $this->assertSame('cold_start', $coldStart->run->state);
        $this->assertFalse($coldStart->run->isSupported());
        $this->assertNull($coldStart->run->expectedMs);
        $this->assertNull($coldStart->run->conservativeLowMs);
        $this->assertFalse($coldStart->run->hasRange());
        $this->assertSame(600000, $coldStart->run->baselineMs);
        $this->assertSame(0, $coldStart->run->sampleCount);
        $this->assertSame(['cold_start'], $coldStart->run->warnings);
        $this->assertNotSame('', $coldStart->generatedAt);
        $this->assertNotSame('', $coldStart->run->evidenceWindowStart);
        $this->assertCount(3, $coldStart->steps);

        $readyCalls = [];
        $ready = $this->client($readyCalls, fn (): array => $this->ok('workflow-timing-prediction-ready.json'));
        $forecast = $ready->adminWorkflowTimings()->prediction('acme', 'run-2');

        $this->assertTrue($forecast->run->isSupported());
        $this->assertSame(1716000, $forecast->run->expectedMs);
        $this->assertTrue($forecast->run->hasRange());
        $this->assertLessThan(
            (int) $forecast->run->conservativeHighMs,
            (int) $forecast->run->conservativeLowMs,
        );
        $this->assertSame(24, $forecast->run->sampleCount);
        $this->assertNotSame('', $forecast->run->predictionVersionUuid);

        $database = $forecast->step('database');
        $this->assertNotNull($database);
        $this->assertSame('sparse', $database->state);
        $this->assertSame(900000, $database->baselineMs);
        $this->assertSame(['sparse_history'], $database->warnings);
        $this->assertNull($forecast->step('absent'));
    }

    public function testConformanceSeparatesActiveFromWait(): void
    {
        $calls = [];
        $client = $this->client($calls, fn (): array => $this->ok('workflow-timing-duration-history-response.json'));

        $history = $client->adminWorkflowTimings()->durationHistory('acme', 'hosting.reconcile', 50);

        $this->assertCount(2, $history->entries);
        $this->assertFalse($history->entries[0]->corrected);
        $this->assertTrue($history->entries[1]->corrected);
        $this->assertSame(600000, $history->entries[0]->baselineMs);
        $this->assertSame(2, $history->entries[0]->revisionNumber);
        $this->assertSame(2, $history->outcomes->completedRuns);
        $this->assertSame(1, $history->outcomes->failedRuns);
        $this->assertSame(1, $history->outcomes->openAttempts);
        $this->assertCount(2, $history->contributions);
        $this->assertSame(662, $history->contributions[0]->contributionPermille);
        $this->assertNotNull($history->contribution('database'));

        $latest = $history->latestCompletedRun;
        $this->assertNotNull($latest);
        $this->assertSame(95000, $latest->wallClockMs);
        $this->assertSame(85400, $latest->activeMs);
        $this->assertSame(9600, $latest->waitMs);
        $this->assertSame(1800000, $latest->nominalMs);
        $this->assertSame(
            $latest->wallClockMs,
            $latest->activeMs + $latest->waitMs,
            'active and wait must account for the wall clock',
        );
        $this->assertSame(
            '/api/v1/admin/workflow-timings/definitions/hosting.reconcile/duration-history?companySlug=acme&limit=50',
            $this->path($calls[0]['url']),
        );
    }

    public function testIdempotencyKeysAreDeterministicPerFact(): void
    {
        $this->assertSame(
            'workflow-timing:hosting.reconcile:op-1:run_started',
            WorkflowTimingIdempotency::runStarted('hosting.reconcile', 'op-1'),
        );
        $this->assertSame(
            'workflow-timing:hosting.reconcile:op-1:step_started:foundation:2',
            WorkflowTimingIdempotency::stepStarted('hosting.reconcile', 'op-1', 'foundation', 2),
        );
        $this->assertNotSame(
            WorkflowTimingIdempotency::stepStarted('hosting.reconcile', 'op-1', 'foundation', 1),
            WorkflowTimingIdempotency::stepFinished('hosting.reconcile', 'op-1', 'foundation', 1),
        );
        $this->assertNotSame(
            WorkflowTimingIdempotency::runStarted('hosting.reconcile', 'op-1'),
            WorkflowTimingIdempotency::runStarted('hosting.reconcile', 'op-2'),
        );
    }

    /** @return array<string, mixed> */
    private function fixture(string $name): array
    {
        $contents = file_get_contents(__DIR__ . '/../../../contract-fixtures/' . $name);
        $this->assertIsString($contents, "contract fixture {$name} is unreadable");
        $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        $this->assertIsArray($decoded);

        return $decoded;
    }

    /** @return array{status: int, body: string} */
    private function ok(string $name): array
    {
        $contents = file_get_contents(__DIR__ . '/../../../contract-fixtures/' . $name);
        $this->assertIsString($contents, "contract fixture {$name} is unreadable");

        return ['status' => 200, 'body' => $contents];
    }

    private function path(string $url): string
    {
        return str_replace('http://localhost:8080', '', $url);
    }

    /**
     * @param list<array{method: string, url: string, body: array<string, mixed>}> $calls
     * @return CustdClient
     */
    private function client(array &$calls, callable $respond): CustdClient
    {
        return new CustdClient('http://localhost:8080', 'admin-token', [
            'admin_http_client' => static function (string $method, string $url, ?array $payload) use (&$calls, $respond): array {
                $calls[] = ['method' => $method, 'url' => $url, 'body' => $payload ?? []];
                return $respond();
            },
        ]);
    }
}
