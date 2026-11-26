<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DefinitionMathAllocationResult
{
    /**
     * @param list<Allocation> $allocations
     */
    public function __construct(
        public array $allocations,
        public bool $deterministicTieBreak,
        public bool $exactConservation,
        public int $horizonMs,
        public int $index,
        public int $negativeAllocations,
        public bool $passed,
        public string $vectorId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Allocation::fromPayload(...), Fields::objects($payload, 'allocations')),
            Fields::boolean($payload, 'deterministicTieBreak'),
            Fields::boolean($payload, 'exactConservation'),
            Fields::integer($payload, 'horizonMs'),
            Fields::integer($payload, 'index'),
            Fields::integer($payload, 'negativeAllocations'),
            Fields::boolean($payload, 'passed'),
            Fields::string($payload, 'vectorId'),
        );
    }
}
