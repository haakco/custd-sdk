<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteInsightsBacklog is one count of work a task has waiting, with what it means. */
final readonly class SiteInsightsBacklog
{
    public function __construct(
        public string $name,
        public int $count,
        public string $meaning,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'name'),
            Fields::integer($payload, 'count'),
            Fields::string($payload, 'meaning'),
        );
    }
}
