<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EventConfig;

use HaakCo\Custd\Fields;

final readonly class EventTypeConfigListResponse
{
    /**
     * @param list<EventTypeConfig> $eventTypes
     */
    public function __construct(
        public array $eventTypes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(EventTypeConfig::fromPayload(...), Fields::objects($payload, 'eventTypes')),
        );
    }
}
