<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Admin\ReportingPack\CanonicalUnit;

final readonly class SourceContribution
{
    /**
     * @param CanonicalUnit::*|null $unit
     * @param SourceAvailability::* $availability
     */
    public function __construct(
        public string $availability,
        public string $sourceKey,
        public string $sourceSeriesKey,
        public ?int $freshnessSeconds = null,
        public ?string $observedAt = null,
        public ?bool $selected = null,
        public ?bool $stale = null,
        public ?string $unit = null,
        public ?float $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'availability'),
            Fields::string($payload, 'sourceKey'),
            Fields::string($payload, 'sourceSeriesKey'),
            Fields::optionalInteger($payload, 'freshnessSeconds'),
            Fields::optionalString($payload, 'observedAt'),
            Fields::optionalBoolean($payload, 'selected'),
            Fields::optionalBoolean($payload, 'stale'),
            Fields::optionalString($payload, 'unit'),
            Fields::optionalNumber($payload, 'value'),
        );
    }
}
