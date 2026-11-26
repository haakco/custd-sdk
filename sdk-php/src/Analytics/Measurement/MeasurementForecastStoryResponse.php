<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryResponse
{
    /**
     * @param list<MeasurementForecastStoryObservation> $observations
     * @param list<MeasurementForecastStorySnapshot> $snapshots
     */
    public function __construct(
        public MeasurementForecastStoryDelivery $delivery,
        public array $observations,
        public CompiledPresentation $presentation,
        public string $projectKind,
        public string $projectName,
        public string $projectUuid,
        public MeasurementForecastStoryProvenance $provenance,
        public array $snapshots,
        public string $state,
        public MeasurementForecastStoryTarget $target,
        public bool $truncated,
        public MeasurementForecastStoryTrust $trust,
        public ?string $currentSnapshotUuid = null,
        public ?MeasurementPredictionStory $prediction = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $prediction = Fields::optionalObject($payload, 'prediction');

        return new self(
            MeasurementForecastStoryDelivery::fromPayload(Fields::object($payload, 'delivery')),
            array_map(MeasurementForecastStoryObservation::fromPayload(...), Fields::objects($payload, 'observations')),
            CompiledPresentation::fromPayload(Fields::object($payload, 'presentation')),
            Fields::string($payload, 'projectKind'),
            Fields::string($payload, 'projectName'),
            Fields::string($payload, 'projectUuid'),
            MeasurementForecastStoryProvenance::fromPayload(Fields::object($payload, 'provenance')),
            array_map(MeasurementForecastStorySnapshot::fromPayload(...), Fields::objects($payload, 'snapshots')),
            Fields::string($payload, 'state'),
            MeasurementForecastStoryTarget::fromPayload(Fields::object($payload, 'target')),
            Fields::boolean($payload, 'truncated'),
            MeasurementForecastStoryTrust::fromPayload(Fields::object($payload, 'trust')),
            Fields::optionalString($payload, 'currentSnapshotUuid'),
            $prediction === null ? null : MeasurementPredictionStory::fromPayload($prediction),
        );
    }
}
