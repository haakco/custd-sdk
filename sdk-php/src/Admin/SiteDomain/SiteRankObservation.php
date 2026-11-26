<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteRankObservation is one day of a tracked keyword in Search Console. state is a SiteRankObservationState value;
 * position and rankingUrl are null unless the domain ranked that day (never 0).
 */
final readonly class SiteRankObservation
{
    /**
     * @param SiteRankObservationState::* $state
     */
    public function __construct(
        public string $day,
        public string $state,
        public int $clicks,
        public int $impressions,
        public ?string $rankingUrl = null,
        public ?float $position = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'day'),
            Fields::string($payload, 'state'),
            Fields::integer($payload, 'clicks'),
            Fields::integer($payload, 'impressions'),
            Fields::optionalString($payload, 'rankingUrl'),
            Fields::optionalNumber($payload, 'position'),
        );
    }
}
