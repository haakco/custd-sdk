<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventSchemaStateResult confirms a schema or event-type state change. */
final readonly class EventSchemaStateResult
{
    public function __construct(public bool $updated)
    {
    }

    public static function fromPayload(mixed $payload): self
    {
        return new self(Fields::boolean(Fields::jsonObject($payload, 'schema state response'), 'updated'));
    }
}
