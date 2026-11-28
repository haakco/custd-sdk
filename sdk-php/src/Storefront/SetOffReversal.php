<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class SetOffReversal
{
    public function __construct(
        public string $creditNoteUuid,
        public string $reversedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'creditNoteUuid'),
            Fields::string($payload, 'reversedAt'),
        );
    }
}
