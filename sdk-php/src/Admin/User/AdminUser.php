<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

use HaakCo\Custd\Fields;

final readonly class AdminUser
{
    /**
     * @param list<string> $roles
     */
    public function __construct(
        public string $companySlug,
        public string $createdAt,
        public string $email,
        public string $globalUserState,
        public string $membershipState,
        public array $roles,
        public string $userUuid,
        public string $welcomeNotificationStatus,
        public ?string $deleteReason = null,
        public ?string $deletedAt = null,
        public ?string $deletedByUserUuid = null,
        public ?string $lastLoginAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'email'),
            Fields::string($payload, 'globalUserState'),
            Fields::string($payload, 'membershipState'),
            Fields::strings($payload, 'roles'),
            Fields::string($payload, 'userUuid'),
            Fields::string($payload, 'welcomeNotificationStatus'),
            Fields::optionalString($payload, 'deleteReason'),
            Fields::optionalString($payload, 'deletedAt'),
            Fields::optionalString($payload, 'deletedByUserUuid'),
            Fields::optionalString($payload, 'lastLoginAt'),
        );
    }
}
