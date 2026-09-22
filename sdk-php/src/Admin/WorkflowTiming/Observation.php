<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Dto;
use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * Observation is one observed run/step fact an external system reports after its
 * own commit. The kind is one of run_started, run_finished, step_started or
 * step_finished; the server folds the facts and derives duration facts from them.
 */
final readonly class Observation implements Dto
{
    public function __construct(
        public string $workflowKey,
        public string $externalRunId,
        public string $kind,
        public string $occurredAt,
        public string $idempotencyKey,
        public string $stepKey = '',
        public int $attempt = 0,
        public string $state = '',
        public string $errorClass = '',
        public string $supersedesFactUuid = '',
        /** @var array<string, string> */
        public array $dimensions = [],
        public string $collector = '',
    ) {
    }

    /** @param array<string, string> $dimensions */
    public static function runStarted(
        string $workflowKey,
        string $externalRunId,
        string $occurredAt,
        string $idempotencyKey,
        array $dimensions = [],
        string $collector = '',
    ): self {
        return new self($workflowKey, $externalRunId, 'run_started', $occurredAt, $idempotencyKey, state: 'running', dimensions: $dimensions, collector: $collector);
    }

    public static function runFinished(string $workflowKey, string $externalRunId, string $occurredAt, string $idempotencyKey, string $state, string $collector = ''): self
    {
        return new self($workflowKey, $externalRunId, 'run_finished', $occurredAt, $idempotencyKey, state: $state, collector: $collector);
    }

    public static function stepStarted(string $workflowKey, string $externalRunId, string $occurredAt, string $idempotencyKey, string $stepKey, int $attempt = 1, string $collector = ''): self
    {
        return new self($workflowKey, $externalRunId, 'step_started', $occurredAt, $idempotencyKey, $stepKey, $attempt, 'running', collector: $collector);
    }

    public static function stepFinished(
        string $workflowKey,
        string $externalRunId,
        string $occurredAt,
        string $idempotencyKey,
        string $stepKey,
        int $attempt = 1,
        string $state = 'completed',
        string $errorClass = '',
        string $collector = '',
    ): self {
        return new self($workflowKey, $externalRunId, 'step_finished', $occurredAt, $idempotencyKey, $stepKey, $attempt, $state, $errorClass, collector: $collector);
    }

    public function superseding(string $supersedesFactUuid): self
    {
        return new self(
            $this->workflowKey,
            $this->externalRunId,
            $this->kind,
            $this->occurredAt,
            $this->idempotencyKey,
            $this->stepKey,
            $this->attempt,
            $this->state,
            $this->errorClass,
            $supersedesFactUuid,
            $this->dimensions,
            $this->collector,
        );
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        $fact = ['kind' => $this->kind, 'occurredAt' => $this->occurredAt];
        if ($this->dimensions !== []) {
            $fact['dimensions'] = $this->dimensions;
        }
        if (str_starts_with($this->kind, 'run_')) {
            $fact['run'] = ['state' => $this->state];
        } else {
            $fact['step'] = Payload::withoutNulls([
                'stepKey' => $this->stepKey,
                'attempt' => $this->attempt,
                'state' => $this->state,
                'errorClass' => $this->errorClass === '' ? null : $this->errorClass,
            ]);
        }
        return Payload::withoutNulls([
            'workflowKey' => $this->workflowKey,
            'externalRunId' => $this->externalRunId,
            'idempotencyKey' => $this->idempotencyKey,
            'supersedesFactUuid' => $this->supersedesFactUuid === '' ? null : $this->supersedesFactUuid,
            'provenance' => $this->provenancePayload(),
            'fact' => $fact,
        ]);
    }

    /** @return array<string, string> */
    private function provenancePayload(): array
    {
        return $this->collector === '' ? [] : ['actorKind' => 'machine', 'collector' => $this->collector];
    }
}
