<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * Evaluation is the chronological rolling-origin evaluation of one workflow's
 * duration series.
 *
 * It reports unavailable with a next action when the revision has not selected a
 * duration prediction version, because calibration cannot be attributed to a
 * version that was never selected.
 */
final readonly class Evaluation
{
    public function __construct(
        public string $workflowKey = '',
        public string $workflowUuid = '',
        public string $seriesKey = '',
        public string $state = 'unavailable',
        public string $nextAction = '',
        public int $baselineMs = 0,
        public OutcomeCounts $outcomes = new OutcomeCounts(),
        public string $predictionVersionUuid = '',
        public ?EvaluationArtifact $artifact = null,
    ) {
    }

    /** isAvailable reports whether an evaluation artifact was attributed to a version. */
    public function isAvailable(): bool
    {
        return $this->artifact !== null;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $artifact = Payload::optionalObject($payload, 'artifact');

        return new self(
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'workflowUuid'),
            Payload::string($payload, 'seriesKey'),
            Payload::string($payload, 'state'),
            Payload::string($payload, 'nextAction'),
            Payload::integer($payload, 'baselineMs'),
            OutcomeCounts::fromPayload(Payload::object($payload, 'outcomes')),
            Payload::optionalString($payload, 'predictionVersionUuid') ?? '',
            $artifact === null ? null : EvaluationArtifact::fromPayload($artifact),
        );
    }
}
