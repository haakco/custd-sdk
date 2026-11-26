<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageAlertEventListResponse
{
    /**
     * @param list<StorageAlertEvent> $events
     */
    public function __construct(
        public array $events,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(StorageAlertEvent::fromPayload(...), Fields::objects($payload, 'events')),
        );
    }
}
