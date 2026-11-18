<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAnalyticsReport is a domain's imported GA4 numbers over windowFrom..windowTo: Organic Search
 * sessions by landing page (busiest first), Organic Search key events by event name, and sessions
 * by channel group. connection and the window are null until the domain is connected and imported;
 * with keyEventsRecorded false no row carries keyEvents.
 */
final readonly class SiteAnalyticsReport
{
    /**
     * @param list<SiteAnalyticsRow> $landingPages
     * @param list<SiteAnalyticsRow> $keyEvents
     * @param list<SiteAnalyticsRow> $channels
     * @param list<SiteAnalyticsUnavailable> $unavailable
     */
    public function __construct(
        public string $domainUuid,
        public bool $keyEventsRecorded,
        public array $landingPages,
        public array $keyEvents,
        public array $channels,
        public array $unavailable,
        public ?SiteAnalyticsConnection $connection = null,
        public ?string $windowFrom = null,
        public ?string $windowTo = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $connection = Fields::optionalObject($payload, 'connection');

        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::boolean($payload, 'keyEventsRecorded'),
            array_map(SiteAnalyticsRow::fromPayload(...), Fields::objects($payload, 'landingPages')),
            array_map(SiteAnalyticsRow::fromPayload(...), Fields::objects($payload, 'keyEvents')),
            array_map(SiteAnalyticsRow::fromPayload(...), Fields::objects($payload, 'channels')),
            array_map(SiteAnalyticsUnavailable::fromPayload(...), Fields::objects($payload, 'unavailable')),
            $connection === null ? null : SiteAnalyticsConnection::fromPayload($connection),
            Fields::optionalString($payload, 'windowFrom'),
            Fields::optionalString($payload, 'windowTo'),
        );
    }
}
