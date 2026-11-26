<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

/** EventTypeList is the tenant's event types. The route answers a bare array; this names it. */
final readonly class EventTypeList
{
    /** @param list<EventType> $eventTypes */
    public function __construct(public array $eventTypes = [])
    {
    }

    public static function fromPayloadList(mixed $payload): self
    {
        $eventTypes = [];
        foreach (Wire::objectList($payload, 'event type list') as $item) {
            $eventTypes[] = EventType::fromPayload($item);
        }

        return new self($eventTypes);
    }
}
