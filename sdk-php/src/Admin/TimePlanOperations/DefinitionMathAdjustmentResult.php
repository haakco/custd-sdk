<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DefinitionMathAdjustmentResult
{
    /**
     * @param list<Allocation> $allocations
     */
    public function __construct(
        public int $actualMs,
        public int $elapsedMs,
        public int $horizonMs,
        public int $index,
        public int $overrunMs,
        public string $reason,
        public int $remainingMs,
        public int $unusedMs,
        public string $vectorId,
        public array $allocations = [],
        public bool $exactConservation = false,
        public bool $markFutureNotRun = false,
        public int $negativeAllocations = 0,
        public bool $passed = false,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'actualMs'),
            Fields::integer($payload, 'elapsedMs'),
            Fields::integer($payload, 'horizonMs'),
            Fields::integer($payload, 'index'),
            Fields::integer($payload, 'overrunMs'),
            Fields::string($payload, 'reason'),
            Fields::integer($payload, 'remainingMs'),
            Fields::integer($payload, 'unusedMs'),
            Fields::string($payload, 'vectorId'),
            array_map(Allocation::fromPayload(...), Fields::objects($payload, 'allocations')),
            Fields::boolean($payload, 'exactConservation'),
            Fields::boolean($payload, 'markFutureNotRun'),
            Fields::integer($payload, 'negativeAllocations'),
            Fields::boolean($payload, 'passed'),
        );
    }
}
