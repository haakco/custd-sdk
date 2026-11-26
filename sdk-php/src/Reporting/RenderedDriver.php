<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Fields;

final readonly class RenderedDriver
{
    public function __construct(
        public RenderedMetricValue $contribution,
        public string $key,
        public string $label,
        public string $method,
        public int $rank,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            RenderedMetricValue::fromPayload(Fields::object($payload, 'contribution')),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
            Fields::string($payload, 'method'),
            Fields::integer($payload, 'rank'),
        );
    }
}
