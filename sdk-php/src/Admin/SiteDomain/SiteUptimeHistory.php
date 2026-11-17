<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteUptimeHistory
{
    /**
     * @param list<SiteUptimeDay> $days
     * @param list<SiteResponseHour> $hours
     */
    public function __construct(
        public string $domainUuid,
        public string $generatedAt,
        public int $responseDays,
        public SiteUptimeWindows $windows,
        public array $days,
        public array $hours,
        public ?string $monitoredSince = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'generatedAt'),
            Fields::integer($payload, 'responseDays'),
            SiteUptimeWindows::fromPayload(Fields::object($payload, 'windows')),
            array_map(SiteUptimeDay::fromPayload(...), Fields::objects($payload, 'days')),
            array_map(SiteResponseHour::fromPayload(...), Fields::objects($payload, 'hours')),
            Fields::optionalString($payload, 'monitoredSince'),
        );
    }
}
