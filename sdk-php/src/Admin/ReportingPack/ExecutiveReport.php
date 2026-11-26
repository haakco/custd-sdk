<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Reporting\Data\ExecutiveReportRecipe;

/**
 * ExecutiveReport is the server-owned, reader-facing meaning of a rendered snapshot. A renderer
 * formats it and never calculates a new headline.
 */
final readonly class ExecutiveReport
{
    /**
     * @param list<string> $findings
     * @param list<string> $actions
     * @param list<string> $supportingWidgets
     * @param ExecutiveReportRecipe::* $recipe
     */
    public function __construct(
        public string $recipe,
        public string $tenantDisplayName,
        public string $title,
        public ExecutivePeriod $period,
        public string $generatedAt,
        public string $asOf,
        public ExecutivePrimaryResult $primary,
        public ExecutiveComparisonResult $comparison,
        public ExecutiveConfidence $confidence,
        public array $findings = [],
        public array $actions = [],
        public array $supportingWidgets = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'recipe'),
            Fields::string($payload, 'tenantDisplayName'),
            Fields::string($payload, 'title'),
            ExecutivePeriod::fromPayload(Fields::object($payload, 'period')),
            Fields::string($payload, 'generatedAt'),
            Fields::string($payload, 'asOf'),
            ExecutivePrimaryResult::fromPayload(Fields::object($payload, 'primary')),
            ExecutiveComparisonResult::fromPayload(Fields::object($payload, 'comparison')),
            ExecutiveConfidence::fromPayload(Fields::object($payload, 'confidence')),
            Fields::optionalStrings($payload, 'findings') ?? [],
            Fields::optionalStrings($payload, 'actions') ?? [],
            Fields::optionalStrings($payload, 'supportingWidgets') ?? [],
        );
    }
}
