<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Admin\ReportingPack\CanonicalUnit;

final readonly class ReconciliationResult
{
    /**
     * @param list<SourceContribution> $contributingSources
     * @param CanonicalUnit::*|null $unit
     * @param SourceAvailability::* $availability
     * @param ReconciliationStatus::* $status
     */
    public function __construct(
        public string $availability,
        public SourceDivergence $divergence,
        public string $seriesKey,
        public string $status,
        public string $tenantKey,
        public array $contributingSources = [],
        public ?string $observedAt = null,
        public ?string $selectedSourceKey = null,
        public ?string $selectedSourceSeries = null,
        public ?string $unit = null,
        public ?float $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'availability'),
            SourceDivergence::fromPayload(Fields::object($payload, 'divergence')),
            Fields::string($payload, 'seriesKey'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'tenantKey'),
            array_map(SourceContribution::fromPayload(...), Fields::optionalObjects($payload, 'contributingSources') ?? []),
            Fields::optionalString($payload, 'observedAt'),
            Fields::optionalString($payload, 'selectedSourceKey'),
            Fields::optionalString($payload, 'selectedSourceSeries'),
            Fields::optionalString($payload, 'unit'),
            Fields::optionalNumber($payload, 'value'),
        );
    }
}
