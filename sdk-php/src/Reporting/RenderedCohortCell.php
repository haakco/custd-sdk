<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Fields;

final readonly class RenderedCohortCell
{
    public function __construct(
        public string $cohort,
        public int $population,
        public RenderedMetricValue $value,
        public string $window,
        public ?bool $suppressed = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'cohort'),
            Fields::integer($payload, 'population'),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'value')),
            Fields::string($payload, 'window'),
            Fields::optionalBoolean($payload, 'suppressed'),
        );
    }
}
