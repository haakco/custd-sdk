<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

use HaakCo\Custd\Fields;

final readonly class AdminUserListResponse
{
    /**
     * @param list<AdminUser> $users
     */
    public function __construct(
        public array $users,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AdminUser::fromPayload(...), Fields::objects($payload, 'users')),
        );
    }
}
