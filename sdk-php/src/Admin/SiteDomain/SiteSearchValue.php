<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchValue joins a domain's search pages to the named analytics goals credited to their
 * landings. goalStatus is a SiteSearchGoalStatus value with goalReason saying why goals are partial or unavailable;
 * attribution explains how goals are credited.
 */
final readonly class SiteSearchValue
{
    /** The days read when none are asked for. */
    public const DEFAULT_DAYS = 28;
    public const MAX_DAYS = 90;
    /** How many goal event types one read names. */
    public const MAX_GOALS = 5;
    /** The most pages one read returns. */
    public const MAX_PAGES = 50;

    /**
     * @param list<string> $goals
     * @param list<SiteSearchValuePage> $pages
     * @param SiteSearchGoalStatus::* $goalStatus
     */
    public function __construct(
        public string $domainUuid,
        public string $siteUuid,
        public int $days,
        public string $from,
        public string $to,
        public array $goals,
        public string $goalStatus,
        public string $attribution,
        public array $pages,
        public ?string $goalReason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'siteUuid'),
            Fields::integer($payload, 'days'),
            Fields::string($payload, 'from'),
            Fields::string($payload, 'to'),
            Fields::strings($payload, 'goals'),
            Fields::string($payload, 'goalStatus'),
            Fields::string($payload, 'attribution'),
            array_map(SiteSearchValuePage::fromPayload(...), Fields::objects($payload, 'pages')),
            Fields::optionalString($payload, 'goalReason'),
        );
    }
}
