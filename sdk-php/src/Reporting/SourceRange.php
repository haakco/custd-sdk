<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class SourceRange
{
    public function __construct(
        public string $end,
        public string $start,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'end'),
            Fields::string($payload, 'start'),
        );
    }
}
