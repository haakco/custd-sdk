<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DefinitionMathAdjustmentResult
{
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
        );
    }
}
