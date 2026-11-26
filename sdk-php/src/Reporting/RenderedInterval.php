<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Fields;

final readonly class RenderedInterval
{
    public function __construct(
        public RenderedMetricValue $estimate,
        public string $label,
        public RenderedMetricValue $lower,
        public RenderedMetricValue $upper,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            RenderedMetricValue::fromPayload(Fields::object($payload, 'estimate')),
            Fields::string($payload, 'label'),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'lower')),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'upper')),
        );
    }
}
