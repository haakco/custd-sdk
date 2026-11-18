<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteGapPage is one competitor page about a gap topic; sources are SiteWebPage::SOURCE_* values. */
final readonly class SiteGapPage
{
    /** @param list<string> $sources */
    public function __construct(
        public string $domain,
        public string $url,
        public array $sources,
        public string $firstSeen,
        public string $lastSeen,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domain'),
            Fields::string($payload, 'url'),
            Fields::strings($payload, 'sources'),
            Fields::string($payload, 'firstSeen'),
            Fields::string($payload, 'lastSeen'),
        );
    }
}
