<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteTrackedKeyword is one keyword a domain tracks, its latest day and its daily observations.
 * country is an ISO 3166-1 alpha-3 code or ALL; device a DEVICE_* value or ALL; status a SiteTrackedKeywordStatus value.
 * pool is the shared search pool's band for the keyword, null unless the tenant joined and the pool holds it.
 */
final readonly class SiteTrackedKeyword
{
    /** Every country, or every device. */
    public const ALL = 'all';
    public const DEVICE_DESKTOP = 'desktop';
    public const DEVICE_MOBILE = 'mobile';
    public const DEVICE_TABLET = 'tablet';

    /**
     * @param list<SiteRankObservation> $observations
     * @param SiteTrackedKeywordStatus::* $status
     */
    public function __construct(
        public string $keywordUuid,
        public string $keyword,
        public string $country,
        public string $device,
        public string $status,
        public int $notifyPosition,
        public string $createdAt,
        public SiteRankObservation $latest,
        public array $observations,
        public ?SearchPoolBand $pool = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $pool = Fields::optionalObject($payload, 'pool');

        return new self(
            Fields::string($payload, 'keywordUuid'),
            Fields::string($payload, 'keyword'),
            Fields::string($payload, 'country'),
            Fields::string($payload, 'device'),
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'notifyPosition'),
            Fields::string($payload, 'createdAt'),
            SiteRankObservation::fromPayload(Fields::object($payload, 'latest')),
            array_map(SiteRankObservation::fromPayload(...), Fields::objects($payload, 'observations')),
            $pool === null ? null : SearchPoolBand::fromPayload($pool),
        );
    }
}
