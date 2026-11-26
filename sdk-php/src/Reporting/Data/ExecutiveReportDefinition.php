<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class ExecutiveReportDefinition
{
    /**
     * @param list<string> $actions
     * @param list<string> $findings
     * @param list<string> $supportingWidgetKeys
     */
    public function __construct(
        public string $comparisonBasis,
        public string $primaryLabel,
        public string $primaryMetricKey,
        public string $primaryUnit,
        public string $primaryWidgetKey,
        public string $recipe,
        public string $scopeLabel,
        public array $actions = [],
        public ?string $comparisonLabel = null,
        public array $findings = [],
        public array $supportingWidgetKeys = [],
        public ?string $targetUnit = null,
        public ?float $targetValue = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'comparisonBasis'),
            Fields::string($payload, 'primaryLabel'),
            Fields::string($payload, 'primaryMetricKey'),
            Fields::string($payload, 'primaryUnit'),
            Fields::string($payload, 'primaryWidgetKey'),
            Fields::string($payload, 'recipe'),
            Fields::string($payload, 'scopeLabel'),
            Fields::optionalStrings($payload, 'actions') ?? [],
            Fields::optionalString($payload, 'comparisonLabel'),
            Fields::optionalStrings($payload, 'findings') ?? [],
            Fields::optionalStrings($payload, 'supportingWidgetKeys') ?? [],
            Fields::optionalString($payload, 'targetUnit'),
            Fields::optionalNumber($payload, 'targetValue'),
        );
    }
}
