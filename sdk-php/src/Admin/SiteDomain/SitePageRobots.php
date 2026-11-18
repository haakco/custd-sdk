<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageRobots is a page's robots meta directives and its X-Robots-Tag header (empty when absent). */
final readonly class SitePageRobots
{
    public function __construct(
        public bool $noindex,
        public bool $nofollow,
        public string $header,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'noindex'),
            Fields::boolean($payload, 'nofollow'),
            Fields::string($payload, 'header'),
        );
    }
}
