<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemList
{
    /**
     * @param list<AppItemSummary> $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppItemSummary::fromPayload(...), Fields::objects($payload, 'items')),
        );
    }
}
