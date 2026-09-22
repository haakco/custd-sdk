<?php

declare(strict_types=1);

namespace HaakCo\Custd\Examples\WorkflowTiming;

use HaakCo\Custd\Admin\WorkflowTiming\Observation;
use HaakCo\Custd\Admin\WorkflowTiming\StepDeclaration;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowDeclaration;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowTimingIdempotency;

/**
 * HostingFixture is the Hosting-shaped generic workflow/phase fixture.
 *
 * It is deliberately provider-neutral: the workflow key, the phase keys and the
 * dimension key describe hosting work in general, so the same contract can map
 * a different provider or product without changing a primitive. Timestamps are
 * derived from a supplied base time rather than stored in the fixture, so the
 * example keeps working as the fixture ages instead of tripping the import-age
 * bound.
 */
final readonly class HostingFixture
{
    /** @param array<string, mixed> $fixture */
    private function __construct(private array $fixture)
    {
    }

    public static function load(string $path): self
    {
        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new \RuntimeException("fixture is unreadable: {$path}");
        }
        $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new \RuntimeException("fixture is not an object: {$path}");
        }

        return new self($decoded);
    }

    public function workflowKey(): string
    {
        return (string) $this->fixture['workflowKey'];
    }

    /** @return list<StepDeclaration> */
    public function steps(): array
    {
        $steps = [];
        foreach ($this->fixture['steps'] as $step) {
            $steps[] = new StepDeclaration(
                (string) $step['stepKey'],
                (string) $step['name'],
                (int) $step['nominalMs'],
            );
        }

        return $steps;
    }

    /** @return array<string, string> */
    public function dimensions(): array
    {
        $dimensions = [];
        foreach ($this->fixture['dimensions'] as $key) {
            $dimensions[(string) $key] = (string) $this->fixture['run']['dimensions'][$key];
        }

        return $dimensions;
    }

    public function outcome(): string
    {
        return (string) $this->fixture['run']['outcome'];
    }

    /** @return list<array<string, mixed>> */
    public function phases(): array
    {
        return $this->fixture['run']['phases'];
    }

    /**
     * declaration builds the declarative shape a consumer reconciles on deploy.
     * Repeating it is a no-op, which is what keeps a redeploy from forking the
     * duration series.
     */
    public function declaration(): WorkflowDeclaration
    {
        $declaration = new WorkflowDeclaration(
            workflowKey: $this->workflowKey(),
            name: (string) $this->fixture['name'],
            description: (string) $this->fixture['description'],
            allowOverlap: (bool) $this->fixture['allowOverlap'],
            dimensions: array_map('strval', $this->fixture['dimensions']),
        );
        foreach ($this->steps() as $step) {
            $declaration = $declaration->withStep($step);
        }

        return $declaration;
    }

    /**
     * observations turns the fixture's phases into the facts the consumer reports
     * after its own commit. The phase order is the occurrence order, so a retry
     * appears as a second attempt of the same step rather than as a rewrite of the
     * first one.
     *
     * @return list<Observation>
     */
    public function observations(
        string $externalRunId,
        string $actorRef,
        \DateTimeImmutable $base,
        string $collector,
    ): array {
        $keys = new WorkflowTimingIdempotency();
        $observations = [
            Observation::runStarted(
                $this->workflowKey(),
                $externalRunId,
                $this->at($base, 0),
                $keys->runStarted($this->workflowKey(), $externalRunId),
                $actorRef,
                $this->dimensions(),
                $collector,
            ),
        ];

        foreach ($this->phases() as $phase) {
            $stepKey = (string) $phase['stepKey'];
            $attempt = (int) $phase['attempt'];
            $observations[] = Observation::stepStarted(
                $this->workflowKey(),
                $externalRunId,
                $this->at($base, (int) $phase['startOffsetMs']),
                $keys->stepStarted($this->workflowKey(), $externalRunId, $stepKey, $attempt),
                $stepKey,
                $actorRef,
                $attempt,
                $collector,
            );
            $observations[] = Observation::stepFinished(
                $this->workflowKey(),
                $externalRunId,
                $this->at($base, (int) $phase['endOffsetMs']),
                $keys->stepFinished($this->workflowKey(), $externalRunId, $stepKey, $attempt),
                $stepKey,
                $actorRef,
                $attempt,
                (string) $phase['state'],
                (string) ($phase['errorClass'] ?? ''),
                $collector,
            );
        }

        $lastPhase = $this->phases()[count($this->phases()) - 1];
        $observations[] = Observation::runFinished(
            $this->workflowKey(),
            $externalRunId,
            $this->at($base, (int) $lastPhase['endOffsetMs']),
            $keys->runFinished($this->workflowKey(), $externalRunId),
            $this->outcome(),
            $actorRef,
            $collector,
        );

        return $observations;
    }

    /** plannedDurationMs is the wall clock the phases add up to. */
    public function plannedDurationMs(): int
    {
        $phases = $this->phases();
        $last = $phases[count($phases) - 1];

        return (int) $last['endOffsetMs'];
    }

    private function at(\DateTimeImmutable $base, int $offsetMs): string
    {
        return $base->modify("+{$offsetMs} milliseconds")->format('Y-m-d\TH:i:s\Z');
    }
}
