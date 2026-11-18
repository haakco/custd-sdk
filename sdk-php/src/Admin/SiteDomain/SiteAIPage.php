<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteAIPage is one page's AI-crawler requests (DNS-verified apart from claimed) and AI-assistant referrals. */
final readonly class SiteAIPage
{
    public function __construct(
        public string $path,
        public int $verifiedCrawlerHits,
        public int $claimedCrawlerHits,
        public int $referralVisits,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'path'),
            Fields::integer($payload, 'verifiedCrawlerHits'),
            Fields::integer($payload, 'claimedCrawlerHits'),
            Fields::integer($payload, 'referralVisits'),
        );
    }
}
