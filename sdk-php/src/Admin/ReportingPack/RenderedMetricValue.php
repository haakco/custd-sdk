<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Reporting\TemporalTrust;

/** RenderedMetricValue is one rendered metric reading. */
final readonly class RenderedMetricValue
{
    public function __construct(
        public float $value,
        public string $unit,
        public int $sampleCount,
        public string $dataSufficiency,
        public bool $complete,
        public ?bool $truncated = null,
        public ?string $currency = null,
        public ?TemporalTrust $trust = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $trust = Fields::optionalObject($payload, 'trust');

        return new self(
            Fields::number($payload, 'value'),
            Fields::string($payload, 'unit'),
            Fields::integer($payload, 'sampleCount'),
            Fields::string($payload, 'dataSufficiency'),
            Fields::boolean($payload, 'complete'),
            Fields::optionalBoolean($payload, 'truncated'),
            Fields::optionalString($payload, 'currency'),
            $trust === null ? null : TemporalTrust::fromPayload($trust),
        );
    }
}
