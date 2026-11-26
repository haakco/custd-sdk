<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Fields;

final readonly class RenderedAnomaly
{
    public function __construct(
        public string $at,
        public float $lower,
        public float $upper,
        public RenderedMetricValue $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'at'),
            Fields::number($payload, 'lower'),
            Fields::number($payload, 'upper'),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'value')),
        );
    }
}
