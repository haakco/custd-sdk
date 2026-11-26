<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

use HaakCo\Custd\Fields;

final readonly class TenantListResponse
{
    /**
     * @param list<Tenant> $tenants
     */
    public function __construct(
        public array $tenants,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Tenant::fromPayload(...), Fields::objects($payload, 'tenants')),
        );
    }
}
