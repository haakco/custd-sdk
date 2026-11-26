<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

final readonly class AdminUserCreateRequest
{
    /**
     * @param list<string> $roles
     */
    public function __construct(
        public string $companySlug,
        public string $email,
        public array $roles,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'email' => $this->email,
            'roles' => $this->roles,
        ];

        return $body;
    }
}
