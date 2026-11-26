<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

/** EventSchemaVersionList is an event type's schema versions. The route answers a bare array; this names it. */
final readonly class EventSchemaVersionList
{
    /** @param list<EventSchemaVersion> $versions */
    public function __construct(public array $versions = [])
    {
    }

    public static function fromPayloadList(mixed $payload): self
    {
        $versions = [];
        foreach (Wire::objectList($payload, 'schema version list') as $item) {
            $versions[] = EventSchemaVersion::fromPayload($item);
        }

        return new self($versions);
    }
}
