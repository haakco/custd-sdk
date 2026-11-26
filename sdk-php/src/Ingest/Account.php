<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * Account is the authenticated caller's account: its company, the company it acts for, and its roles and
 * permissions.
 */
final readonly class Account
{
    /**
     * @param list<string> $roles
     * @param list<string> $permissions
     */
    public function __construct(
        public string $companySlug,
        public string $email,
        public array $roles,
        public array $permissions,
        public ?string $effectiveCompanySlug = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'email'),
            Fields::strings($payload, 'roles'),
            Fields::strings($payload, 'permissions'),
            Fields::optionalString($payload, 'effectiveCompanySlug'),
        );
    }
}
