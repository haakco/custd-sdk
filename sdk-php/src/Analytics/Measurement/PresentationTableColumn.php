<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class PresentationTableColumn
{
    public function __construct(
        public string $key,
        public string $label,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
        );
    }
}
