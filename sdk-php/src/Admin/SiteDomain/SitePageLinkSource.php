<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageLinkSource is a page of the domain that mentions a ranking query in its title or a heading. */
final readonly class SitePageLinkSource
{
    public const WHERE_TITLE = 'title';
    public const WHERE_HEADING = 'heading';

    /**
     * @param SitePageLinkPlacement::* $where
     */
    public function __construct(
        public string $url,
        public string $title,
        public string $query,
        public string $where,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'url'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'query'),
            Fields::string($payload, 'where'),
        );
    }
}
