<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class DashboardSharePolicy
{
    /**
     * @param list<ReportingComparisonPreset::*> $comparisonPresets
     * @param list<DashboardRelativeRange::*> $relativeRanges
     */
    public function __construct(
        public array $comparisonPresets = [],
        public array $relativeRanges = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalStrings($payload, 'comparisonPresets') ?? [],
            Fields::optionalStrings($payload, 'relativeRanges') ?? [],
        );
    }
}
