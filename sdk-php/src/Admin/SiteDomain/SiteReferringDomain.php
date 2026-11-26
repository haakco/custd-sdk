<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteReferringDomain is one domain linking to the Site's domain. sources are
 * SiteLinkSource values; a count, followed or rank a source did not report is null.
 */
final readonly class SiteReferringDomain
{
    /** @param list<string> $sources */
    public function __construct(
        public string $domain,
        public array $sources,
        public ?int $bingLinks = null,
        public ?int $crawlLinks = null,
        public ?bool $followed = null,
        public ?string $anchorText = null,
        public ?int $harmonicRank = null,
        public ?int $pageRankRank = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domain'),
            Fields::strings($payload, 'sources'),
            Fields::optionalInteger($payload, 'bingLinks'),
            Fields::optionalInteger($payload, 'crawlLinks'),
            Fields::optionalBoolean($payload, 'followed'),
            Fields::optionalString($payload, 'anchorText'),
            Fields::optionalInteger($payload, 'harmonicRank'),
            Fields::optionalInteger($payload, 'pageRankRank'),
        );
    }
}
