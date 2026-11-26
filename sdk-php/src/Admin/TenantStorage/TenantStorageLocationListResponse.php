<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TenantStorage;

use HaakCo\Custd\Fields;

final readonly class TenantStorageLocationListResponse
{
    /**
     * @param list<TenantStorageLocationView> $locations
     */
    public function __construct(
        public array $locations,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(TenantStorageLocationView::fromPayload(...), Fields::objects($payload, 'locations')),
        );
    }
}
