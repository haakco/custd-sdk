<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteLighthousePages lists the extra pages Lighthouse measures besides the home page. */
final readonly class SiteLighthousePages
{
    /** How many extra pages a domain may set. */
    public const MAX_EXTRA_PAGES = 5;

    /** @param list<string> $urls */
    public function __construct(
        public string $domainUuid,
        public string $homePage,
        public array $urls,
        public int $maxPages,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'homePage'),
            Fields::strings($payload, 'urls'),
            Fields::integer($payload, 'maxPages'),
        );
    }
}
