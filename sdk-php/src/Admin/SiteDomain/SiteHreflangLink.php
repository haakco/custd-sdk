<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteHreflangLink is one alternate-language link a page declares. */
final readonly class SiteHreflangLink
{
    public function __construct(
        public string $code,
        public string $href,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'code'), Fields::string($payload, 'href'));
    }
}
