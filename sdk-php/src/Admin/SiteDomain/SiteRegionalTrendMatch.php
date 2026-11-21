<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteRegionalTrendMatch
{
    public function __construct(
        public string $topic,
        public string $sourceUrl,
        public string $publishedAt,
        public string $matchedTerm,
        public ?string $discussionUrl = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'topic'),
            Fields::string($payload, 'sourceUrl'),
            Fields::string($payload, 'publishedAt'),
            Fields::string($payload, 'matchedTerm'),
            Fields::optionalString($payload, 'discussionUrl'),
        );
    }
}
