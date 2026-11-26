<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SitePageCheckRequest checks draft HTML as if $url served it. The draft is never stored;
 * html is at most 512 KiB and $url must be on the domain's host. $previousUrl, the page's current
 * address on the same host, asks for the redirect a move needs; $phrase (at most 100 characters)
 * asks where it appears; $scope SCOPE_CONTENT checks a fragment of body content without the head
 * rules. Each is left out when null or empty.
 */
final readonly class SitePageCheckRequest
{
    /** A whole page, the server's default. */
    public const SCOPE_PAGE = 'page';

    /** Body content only: the response's checkedRules lists the rules checked. */
    public const SCOPE_CONTENT = 'content';

    /**
     * @param SitePageCheckScope::*|null $scope
     */
    public function __construct(
        public string $url,
        public string $html,
        public ?string $previousUrl = null,
        public ?string $phrase = null,
        public ?string $scope = null,
    ) {
    }

    /** @return array{url: string, html: string, previousUrl?: string, phrase?: string, scope?: string} */
    public function serialise(): array
    {
        $body = ['url' => $this->url, 'html' => $this->html];
        if ($this->previousUrl !== null && $this->previousUrl !== '') {
            $body['previousUrl'] = $this->previousUrl;
        }
        if ($this->phrase !== null && $this->phrase !== '') {
            $body['phrase'] = $this->phrase;
        }
        if ($this->scope !== null && $this->scope !== '') {
            $body['scope'] = $this->scope;
        }

        return $body;
    }
}
