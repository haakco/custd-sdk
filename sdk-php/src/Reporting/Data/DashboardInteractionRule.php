<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class DashboardInteractionRule
{
    /**
     * @param ReportingDashboardInteraction::* $action
     * @param ReportingComparisonPreset::*|null $comparisonPreset
     * @param DashboardResetBehavior::* $resetBehavior
     */
    public function __construct(
        public string $action,
        public string $dimension,
        public string $key,
        public string $linkedFilterGroup,
        public string $resetBehavior,
        public string $sourceWidget,
        public string $targetWidget,
        public ?string $comparisonPreset = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'action'),
            Fields::string($payload, 'dimension'),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'linkedFilterGroup'),
            Fields::string($payload, 'resetBehavior'),
            Fields::string($payload, 'sourceWidget'),
            Fields::string($payload, 'targetWidget'),
            Fields::optionalString($payload, 'comparisonPreset'),
        );
    }
}
