<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

use HaakCo\Custd\Fields;

final readonly class Tenant
{
    /**
     * @param TenantPurpose::* $purpose
     */
    public function __construct(
        public bool $autoCreateEnvironments,
        public int $companyId,
        public string $companyName,
        public string $companyUuid,
        public bool $enabled,
        public string $purpose,
        public string $slug,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'autoCreateEnvironments'),
            Fields::integer($payload, 'companyId'),
            Fields::string($payload, 'companyName'),
            Fields::string($payload, 'companyUuid'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'purpose'),
            Fields::string($payload, 'slug'),
        );
    }
}
