<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementOverviewArea
{
    /**
     * @param list<MeasurementOverviewPoint> $points
     */
    public function __construct(
        public string $detail,
        public string $headline,
        public string $key,
        public string $state,
        public string $title,
        public string $value,
        public string $widgetKind,
        public array $points = [],
        public ?string $provenance = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'detail'),
            Fields::string($payload, 'headline'),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'value'),
            Fields::string($payload, 'widgetKind'),
            array_map(MeasurementOverviewPoint::fromPayload(...), Fields::optionalObjects($payload, 'points') ?? []),
            Fields::optionalString($payload, 'provenance'),
        );
    }
}
