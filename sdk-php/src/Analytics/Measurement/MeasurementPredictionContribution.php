<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionContribution
{
    public function __construct(
        public float $delta,
        public string $featureKey,
        public string $movement,
        public float $value,
        public ?float $featureValue = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'delta'),
            Fields::string($payload, 'featureKey'),
            Fields::string($payload, 'movement'),
            Fields::number($payload, 'value'),
            Fields::optionalNumber($payload, 'featureValue'),
        );
    }
}
