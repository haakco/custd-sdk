<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class OutboxStatus
{
    public function __construct(
        public int $failed,
        public string $name,
        public int $pending,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'failed'),
            Fields::string($payload, 'name'),
            Fields::integer($payload, 'pending'),
        );
    }
}
