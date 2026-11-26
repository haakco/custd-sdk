<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** DataSpace is one child data space of a parent tenant. */
final readonly class DataSpace
{
    public function __construct(
        public string $slug,
        public string $companyName,
        public string $parentCompanySlug,
        public bool $enabled,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'slug'),
            Fields::string($payload, 'companyName'),
            Fields::string($payload, 'parentCompanySlug'),
            Fields::boolean($payload, 'enabled'),
        );
    }
}
