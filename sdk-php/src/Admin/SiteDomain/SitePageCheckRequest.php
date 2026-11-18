<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SitePageCheckRequest checks draft HTML as if $url served it. The draft is never stored;
 * html is at most 512 KiB and $url must be on the domain's host.
 */
final readonly class SitePageCheckRequest
{
    public function __construct(
        public string $url,
        public string $html,
    ) {
    }

    /** @return array{url: string, html: string} */
    public function serialise(): array
    {
        return ['url' => $this->url, 'html' => $this->html];
    }
}
