<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionStory
{
    /**
     * @param list<MeasurementPredictionContribution> $contributions
     * @param list<MeasurementPredictionStoryPoint> $history
     * @param list<MeasurementPredictionStoryOutcome> $outcomes
     * @param list<MeasurementPredictionSourceHealth> $sources
     */
    public function __construct(
        public array $contributions,
        public string $definitionKey,
        public string $definitionUuid,
        public string $displayName,
        public array $history,
        public array $outcomes,
        public string $qualityState,
        public array $sources,
        public string $state,
        public ?MeasurementPredictionStoryPoint $current = null,
        public ?MeasurementPredictionStoryEvaluation $evaluation = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $current = Fields::optionalObject($payload, 'current');
        $evaluation = Fields::optionalObject($payload, 'evaluation');

        return new self(
            array_map(MeasurementPredictionContribution::fromPayload(...), Fields::objects($payload, 'contributions')),
            Fields::string($payload, 'definitionKey'),
            Fields::string($payload, 'definitionUuid'),
            Fields::string($payload, 'displayName'),
            array_map(MeasurementPredictionStoryPoint::fromPayload(...), Fields::objects($payload, 'history')),
            array_map(MeasurementPredictionStoryOutcome::fromPayload(...), Fields::objects($payload, 'outcomes')),
            Fields::string($payload, 'qualityState'),
            array_map(MeasurementPredictionSourceHealth::fromPayload(...), Fields::objects($payload, 'sources')),
            Fields::string($payload, 'state'),
            $current === null ? null : MeasurementPredictionStoryPoint::fromPayload($current),
            $evaluation === null ? null : MeasurementPredictionStoryEvaluation::fromPayload($evaluation),
        );
    }
}
