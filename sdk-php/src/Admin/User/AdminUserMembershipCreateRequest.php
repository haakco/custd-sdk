<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

final readonly class AdminUserMembershipCreateRequest
{
    /**
     * @param list<AdminUserRoleSlug::*> $roles
     */
    public function __construct(
        public string $companySlug,
        public array $roles,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'roles' => $this->roles,
        ];

        return $body;
    }
}
