<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class Allocation
{
    public function __construct(
        public string $blockId,
        public int $durationMs,
        public int $sequence,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'blockId'),
            Fields::integer($payload, 'durationMs'),
            Fields::integer($payload, 'sequence'),
        );
    }
}
