<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteLighthouseHistory is the lab runs of one page (url: the home page unless an extra page was
 * asked for) and, in pages, every measured page's latest score against its previous one. Servers
 * before per-page Lighthouse send neither: url is then null and pages empty.
 */
final readonly class SiteLighthouseHistory
{
    /**
     * @param list<SiteLighthouseRun> $runs
     * @param list<SiteLighthousePageComparison> $pages
     */
    public function __construct(
        public string $domainUuid,
        public int $days,
        public array $runs,
        public ?string $url = null,
        public array $pages = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::integer($payload, 'days'),
            array_map(SiteLighthouseRun::fromPayload(...), Fields::objects($payload, 'runs')),
            Fields::optionalString($payload, 'url'),
            array_map(SiteLighthousePageComparison::fromPayload(...), Fields::optionalObjects($payload, 'pages') ?? []),
        );
    }
}
