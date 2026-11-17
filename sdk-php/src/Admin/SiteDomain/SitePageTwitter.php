<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageTwitter is a page's twitter: card tags; each is empty when absent. */
final readonly class SitePageTwitter
{
    public function __construct(
        public string $card,
        public string $title,
        public string $description,
        public string $image,
        public string $site,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'card'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'image'),
            Fields::string($payload, 'site'),
        );
    }
}
