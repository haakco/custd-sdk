<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventType is one event type the tenant can send. */
final readonly class EventType
{
    public function __construct(
        public string $slug,
        public string $name,
        public bool $enabled,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'slug'),
            Fields::string($payload, 'name'),
            Fields::boolean($payload, 'enabled'),
        );
    }
}
