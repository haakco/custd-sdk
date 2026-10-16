<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserDeleteResponse is the body of a successful parser deletion.
 */
final readonly class ParserDeleteResponse
{
    public function __construct(
        public bool $deleted = false,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::boolean($payload, "deleted"));
    }
}
