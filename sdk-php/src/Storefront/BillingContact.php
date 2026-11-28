<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class BillingContact
{
    public function __construct(
        public string $companyUuid,
        public string $name,
        public string $email,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companyUuid'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'email'),
        );
    }
}
