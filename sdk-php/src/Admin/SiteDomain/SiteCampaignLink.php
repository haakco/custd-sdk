<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteCampaignLink is one saved campaign link. taggedUrl is the link to share; term and content
 * are empty when unset; archivedAt is null while the link is active.
 */
final readonly class SiteCampaignLink
{
    public function __construct(
        public string $linkUuid,
        public string $url,
        public string $source,
        public string $medium,
        public string $campaign,
        public string $term,
        public string $content,
        public string $taggedUrl,
        public string $createdAt,
        public ?string $archivedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'linkUuid'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'medium'),
            Fields::string($payload, 'campaign'),
            Fields::string($payload, 'term'),
            Fields::string($payload, 'content'),
            Fields::string($payload, 'taggedUrl'),
            Fields::string($payload, 'createdAt'),
            Fields::optionalString($payload, 'archivedAt'),
        );
    }
}
