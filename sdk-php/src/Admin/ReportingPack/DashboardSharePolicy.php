<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** DashboardSharePolicy bounds the ranges and comparison presets a dashboard may share. */
final readonly class DashboardSharePolicy
{
    /**
     * @param list<string>|null $relativeRanges
     * @param list<string>|null $comparisonPresets
     */
    public function __construct(
        public ?array $relativeRanges = null,
        public ?array $comparisonPresets = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalStrings($payload, 'relativeRanges'),
            Fields::optionalStrings($payload, 'comparisonPresets'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [];
        if ($this->relativeRanges !== null) {
            $payload['relativeRanges'] = $this->relativeRanges;
        }
        if ($this->comparisonPresets !== null) {
            $payload['comparisonPresets'] = $this->comparisonPresets;
        }

        return $payload;
    }
}
