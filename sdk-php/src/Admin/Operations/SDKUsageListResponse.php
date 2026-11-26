<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SDKUsageListResponse
{
    /**
     * @param list<SDKUsageItem> $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SDKUsageItem::fromPayload(...), Fields::objects($payload, 'items')),
        );
    }
}
