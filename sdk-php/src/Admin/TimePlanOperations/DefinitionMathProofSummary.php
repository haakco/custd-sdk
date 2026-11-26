<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DefinitionMathProofSummary
{
    public function __construct(
        public int $adjustmentVectorCount,
        public bool $deterministicTieBreak,
        public bool $exactConservation,
        public int $initialVectorCount,
        public int $negativeAllocations,
        public bool $passed,
        public int $vectorCount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'adjustmentVectorCount'),
            Fields::boolean($payload, 'deterministicTieBreak'),
            Fields::boolean($payload, 'exactConservation'),
            Fields::integer($payload, 'initialVectorCount'),
            Fields::integer($payload, 'negativeAllocations'),
            Fields::boolean($payload, 'passed'),
            Fields::integer($payload, 'vectorCount'),
        );
    }
}
