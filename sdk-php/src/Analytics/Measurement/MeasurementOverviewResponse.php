<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementOverviewResponse
{
    /**
     * @param list<MeasurementOverviewArea> $areas
     */
    public function __construct(
        public array $areas,
        public string $generatedAt,
        public MeasurementOverviewTenant $tenant,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementOverviewArea::fromPayload(...), Fields::objects($payload, 'areas')),
            Fields::string($payload, 'generatedAt'),
            MeasurementOverviewTenant::fromPayload(Fields::object($payload, 'tenant')),
        );
    }
}
