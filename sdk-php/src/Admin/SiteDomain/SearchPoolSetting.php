<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SearchPoolSetting says whether the tenant shares its Search Console queries in the shared search
 * pool, and the rules a pooled query must meet: at least minContributors tenants and minImpressions
 * impressions over windowDays days. joinedAt and acceptedTermsVersion are null while the
 * tenant has not joined; termsVersion is the version a join must name (null from an older server).
 */
final readonly class SearchPoolSetting
{
    /** The pool access of SiteRankings::$pool. */
    public const ACCESS_JOINED = 'joined';
    public const ACCESS_NOT_JOINED = 'not_joined';
    public const MIN_CONTRIBUTORS = 5;
    public const MIN_IMPRESSIONS = 100;
    public const WINDOW_DAYS = 28;

    public function __construct(
        public bool $joined,
        public int $minContributors,
        public int $minImpressions,
        public int $windowDays,
        public ?string $joinedAt = null,
        public ?string $termsVersion = null,
        public ?string $acceptedTermsVersion = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'joined'),
            Fields::integer($payload, 'minContributors'),
            Fields::integer($payload, 'minImpressions'),
            Fields::integer($payload, 'windowDays'),
            Fields::optionalString($payload, 'joinedAt'),
            Fields::optionalString($payload, 'termsVersion'),
            Fields::optionalString($payload, 'acceptedTermsVersion'),
        );
    }
}
