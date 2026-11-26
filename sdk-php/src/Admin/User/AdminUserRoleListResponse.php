<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

use HaakCo\Custd\Fields;

final readonly class AdminUserRoleListResponse
{
    /**
     * @param list<AdminUserRole> $roles
     */
    public function __construct(
        public array $roles,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AdminUserRole::fromPayload(...), Fields::objects($payload, 'roles')),
        );
    }
}
