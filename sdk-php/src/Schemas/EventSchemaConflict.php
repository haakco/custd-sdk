<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventSchemaConflict is a field a registration would change incompatibly. */
final readonly class EventSchemaConflict
{
    public function __construct(public string $field, public string $message)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'field'), Fields::string($payload, 'message'));
    }
}
