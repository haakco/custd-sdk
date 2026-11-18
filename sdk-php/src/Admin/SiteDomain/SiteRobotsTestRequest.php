<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteRobotsTestRequest asks whether $userAgent (a product token such as Googlebot) may crawl
 * $url (a path such as /blog/ or an http(s) URL). A null $robotsTxt tests the domain's live file.
 */
final readonly class SiteRobotsTestRequest
{
    public function __construct(
        public string $url,
        public string $userAgent,
        public ?string $robotsTxt = null,
    ) {
    }

    /** @return array{url: string, userAgent: string, robotsTxt?: string} */
    public function serialise(): array
    {
        $body = ['url' => $this->url, 'userAgent' => $this->userAgent];
        if ($this->robotsTxt !== null) {
            $body['robotsTxt'] = $this->robotsTxt;
        }

        return $body;
    }
}
