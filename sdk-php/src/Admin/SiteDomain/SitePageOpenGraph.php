<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageOpenGraph is a page's og: tags; each is empty when absent. */
final readonly class SitePageOpenGraph
{
    public function __construct(
        public string $title,
        public string $description,
        public string $image,
        public string $url,
        public string $type,
        public string $siteName,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'title'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'image'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'type'),
            Fields::string($payload, 'siteName'),
        );
    }
}
