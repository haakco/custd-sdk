<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventSchemaVersion is one stored version of an event type's schema; jsonSchema is the document as registered. */
final readonly class EventSchemaVersion
{
    public function __construct(
        public string $version,
        public string $jsonSchema,
        public bool $isActive,
        public bool $enabled,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'version'),
            Fields::string($payload, 'jsonSchema'),
            Fields::boolean($payload, 'isActive'),
            Fields::boolean($payload, 'enabled'),
        );
    }
}
