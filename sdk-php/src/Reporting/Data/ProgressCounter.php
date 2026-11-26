<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class ProgressCounter
{
    public function __construct(
        public int $count,
        public string $key,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'count'),
            Fields::string($payload, 'key'),
        );
    }
}
