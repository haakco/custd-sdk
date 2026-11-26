<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Fields;

final readonly class PrivacyIdentifierListResponse
{
    /**
     * @param list<PrivacyIdentifierMapping> $mappings
     */
    public function __construct(
        public string $companySlug,
        public array $mappings,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            array_map(PrivacyIdentifierMapping::fromPayload(...), Fields::objects($payload, 'mappings')),
        );
    }
}
