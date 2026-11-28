<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Binding
{
    public function __construct(
        public string $slug,
        public string $sellerCompanyUuid,
        public string $appUuid,
        public string $createdAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'slug'),
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'appUuid'),
            Fields::string($payload, 'createdAt'),
        );
    }
}
