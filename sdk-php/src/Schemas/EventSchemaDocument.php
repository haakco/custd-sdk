<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/**
 * EventSchemaDocument is one version's JSON Schema document exactly as stored. A JSON Schema is an open
 * document, so it stays the decoded object rather than a typed shape.
 */
final readonly class EventSchemaDocument
{
    public function __construct(public \stdClass $schema)
    {
    }

    public static function fromPayload(mixed $payload): self
    {
        return new self(Fields::jsonObject($payload, 'schema document'));
    }
}
