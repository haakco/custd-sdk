<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DefinitionMathProofResponse
{
    /**
     * @param list<DefinitionMathAdjustmentResult> $adjustments
     * @param list<DefinitionMathAllocationResult> $allocations
     * @param list<DefinitionMathDefinitionResult> $definitions
     */
    public function __construct(
        public array $adjustments,
        public array $allocations,
        public string $allocatorVersion,
        public string $companySlug,
        public string $conformanceSchemaVersion,
        public array $definitions,
        public string $observedAt,
        public string $schemaVersion,
        public string $source,
        public DefinitionMathProofSummary $summary,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DefinitionMathAdjustmentResult::fromPayload(...), Fields::objects($payload, 'adjustments')),
            array_map(DefinitionMathAllocationResult::fromPayload(...), Fields::objects($payload, 'allocations')),
            Fields::string($payload, 'allocatorVersion'),
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'conformanceSchemaVersion'),
            array_map(DefinitionMathDefinitionResult::fromPayload(...), Fields::objects($payload, 'definitions')),
            Fields::string($payload, 'observedAt'),
            Fields::string($payload, 'schemaVersion'),
            Fields::string($payload, 'source'),
            DefinitionMathProofSummary::fromPayload(Fields::object($payload, 'summary')),
        );
    }
}
