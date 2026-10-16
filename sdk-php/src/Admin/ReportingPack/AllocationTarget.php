<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** AllocationTarget distributes a usage series to a target series with a weight. */
final readonly class AllocationTarget
{
    public function __construct(
        public string $seriesKey,
        public float $weight,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'seriesKey'), Fields::number($payload, 'weight'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['seriesKey' => $this->seriesKey, 'weight' => $this->weight];
    }
}
