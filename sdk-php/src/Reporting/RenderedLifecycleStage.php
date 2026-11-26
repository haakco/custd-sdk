<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Fields;

final readonly class RenderedLifecycleStage
{
    public function __construct(
        public RenderedMetricValue $converted,
        public RenderedMetricValue $dropOff,
        public RenderedMetricValue $entered,
        public string $key,
        public string $label,
        public int $order,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            RenderedMetricValue::fromPayload(Fields::object($payload, 'converted')),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'dropOff')),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'entered')),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
            Fields::integer($payload, 'order'),
        );
    }
}
