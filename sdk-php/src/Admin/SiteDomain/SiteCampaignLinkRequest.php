<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteCampaignLinkRequest tags a page on the domain's own host with UTM values. source, medium and
 * campaign are required; term (the paid keyword) and content are optional and left out when null
 * or empty. Every value is at most 100 characters; the server trims, lower-cases and joins spaces
 * with "_".
 */
final readonly class SiteCampaignLinkRequest
{
    public function __construct(
        public string $url,
        public string $source,
        public string $medium,
        public string $campaign,
        public ?string $term = null,
        public ?string $content = null,
    ) {
    }

    /** @return array{url: string, source: string, medium: string, campaign: string, term?: string, content?: string} */
    public function serialise(): array
    {
        $body = ['url' => $this->url, 'source' => $this->source, 'medium' => $this->medium, 'campaign' => $this->campaign];
        if ($this->term !== null && $this->term !== '') {
            $body['term'] = $this->term;
        }
        if ($this->content !== null && $this->content !== '') {
            $body['content'] = $this->content;
        }

        return $body;
    }
}
