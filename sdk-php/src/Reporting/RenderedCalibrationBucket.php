<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Fields;

final readonly class RenderedCalibrationBucket
{
    public function __construct(
        public RenderedMetricValue $observed,
        public float $predictedLower,
        public float $predictedUpper,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            RenderedMetricValue::fromPayload(Fields::object($payload, 'observed')),
            Fields::number($payload, 'predictedLower'),
            Fields::number($payload, 'predictedUpper'),
        );
    }
}
