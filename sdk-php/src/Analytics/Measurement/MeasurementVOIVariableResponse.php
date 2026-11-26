<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementVOIVariableResponse
{
    public function __construct(
        public float $evpi,
        public float $measurementCost,
        public string $name,
        public int $rank,
        public string $variableUuid,
        public bool $worthMeasuring,
        public ?float $evppi = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'evpi'),
            Fields::number($payload, 'measurementCost'),
            Fields::string($payload, 'name'),
            Fields::integer($payload, 'rank'),
            Fields::string($payload, 'variableUuid'),
            Fields::boolean($payload, 'worthMeasuring'),
            Fields::optionalNumber($payload, 'evppi'),
        );
    }
}
