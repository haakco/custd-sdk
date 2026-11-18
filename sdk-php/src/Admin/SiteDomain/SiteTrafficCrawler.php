<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteTrafficCrawler is one crawler's requests. identity is IDENTITY_VERIFIED when DNS confirmed it and
 * IDENTITY_CLAIMS_TO_BE when only its User-Agent says so; ai marks an AI assistant or training crawler.
 */
final readonly class SiteTrafficCrawler
{
    public const IDENTITY_VERIFIED = 'verified';
    public const IDENTITY_CLAIMS_TO_BE = 'claims_to_be';

    public function __construct(
        public string $crawler,
        public string $identity,
        public bool $ai,
        public int $requests,
        public int $notFound,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'crawler'),
            Fields::string($payload, 'identity'),
            Fields::boolean($payload, 'ai'),
            Fields::integer($payload, 'requests'),
            Fields::integer($payload, 'notFound'),
        );
    }
}
