<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class QuantitySummary
{
    public function __construct(
        public Histogram $histogram,
        public float $mean,
        public Percentiles $percentiles,
        public float $stdDev,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Histogram::fromPayload(Fields::object($payload, 'histogram')),
            Fields::number($payload, 'mean'),
            Percentiles::fromPayload(Fields::object($payload, 'percentiles')),
            Fields::number($payload, 'stdDev'),
        );
    }
}
