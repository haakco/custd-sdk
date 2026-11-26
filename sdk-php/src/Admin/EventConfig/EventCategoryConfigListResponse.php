<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EventConfig;

use HaakCo\Custd\Fields;

final readonly class EventCategoryConfigListResponse
{
    /**
     * @param list<EventCategoryConfig> $eventCategories
     */
    public function __construct(
        public array $eventCategories,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(EventCategoryConfig::fromPayload(...), Fields::objects($payload, 'eventCategories')),
        );
    }
}
