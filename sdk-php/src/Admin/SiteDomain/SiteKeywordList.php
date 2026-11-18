<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteKeywordList is a named list of keywords a Site keeps; seedTerm is its optional topic;
 * related is Bing's related keywords for the seed term, null until read. */
final readonly class SiteKeywordList
{
    /** @param list<string> $keywords */
    public function __construct(
        public string $name,
        public array $keywords,
        public string $createdAt,
        public string $updatedAt,
        public ?string $seedTerm = null,
        public ?SiteRelatedKeywords $related = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $related = Fields::optionalObject($payload, 'related');

        return new self(
            Fields::string($payload, 'name'),
            Fields::strings($payload, 'keywords'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'updatedAt'),
            Fields::optionalString($payload, 'seedTerm'),
            $related === null ? null : SiteRelatedKeywords::fromPayload($related),
        );
    }
}
