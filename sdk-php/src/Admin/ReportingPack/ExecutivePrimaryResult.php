<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ExecutivePrimaryResult is the headline value and its total over the reported period. */
final readonly class ExecutivePrimaryResult
{
    public function __construct(
        public string $label,
        public string $unit,
        public string $scope,
        public RenderedMetricValue $value,
        public RenderedMetricValue $periodTotal,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            Fields::string($payload, 'unit'),
            Fields::string($payload, 'scope'),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'value')),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'periodTotal')),
        );
    }
}
