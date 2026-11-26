<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Fields;

final readonly class RenderedQuantile
{
    public function __construct(
        public float $quantile,
        public RenderedMetricValue $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'quantile'),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'value')),
        );
    }
}
