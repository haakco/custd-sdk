<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\Prediction\DurationForecastEvaluationArtifact;
use HaakCo\Custd\Fields;

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
        public ?DurationForecastEvaluationArtifact $artifact = null,
    ) {
    }

    /** isAvailable reports whether an evaluation artifact was attributed to a version. */
    public function isAvailable(): bool
    {
        return $this->artifact !== null;
    }

    /**
     * fromPayload reads the shape-preserving decode, so an empty interval `{}` in the artifact stays
     * an object for the shared prediction DTO. The outcome tally is flat integers.
     */
    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'workflow timing evaluation');
        $artifact = Fields::optionalObject($object, 'artifact');

        return new self(
            Fields::string($object, 'workflowKey'),
            Fields::string($object, 'workflowUuid'),
            Fields::string($object, 'seriesKey'),
            Fields::string($object, 'state'),
            Fields::string($object, 'nextAction'),
            Fields::integer($object, 'baselineMs'),
            OutcomeCounts::fromPayload(get_object_vars(Fields::object($object, 'outcomes'))),
            Fields::optionalString($object, 'predictionVersionUuid') ?? '',
            $artifact === null ? null : DurationForecastEvaluationArtifact::fromPayload($artifact),
        );
    }
}
