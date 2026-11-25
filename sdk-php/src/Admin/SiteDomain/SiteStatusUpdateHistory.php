<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteStatusUpdateHistory is the latest published updates, newest first. */
final readonly class SiteStatusUpdateHistory
{
    /** @param list<SiteStatusUpdate> $updates */
    public function __construct(
        public array $updates,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(SiteStatusUpdate::fromPayload(...), Fields::objects($payload, 'updates')));
    }
}
