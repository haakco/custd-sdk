<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class PresentationReference
{
    public function __construct(
        public string $label,
        public string $role,
        public ?string $date = null,
        public ?float $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            Fields::string($payload, 'role'),
            Fields::optionalString($payload, 'date'),
            Fields::optionalNumber($payload, 'value'),
        );
    }
}
