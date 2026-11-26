<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

final readonly class AdminUserEnableRequest
{
    /**
     * @param list<string> $roles
     */
    public function __construct(
        public array $roles,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'roles' => $this->roles,
        ];

        return $body;
    }
}
