<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageRecheckList is the rechecks listPageRechecks found, in the order asked. */
final readonly class SitePageRecheckList
{
    /** @param list<SitePageRecheck> $rechecks */
    public function __construct(
        public array $rechecks,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(SitePageRecheck::fromPayload(...), Fields::objects($payload, 'rechecks')));
    }
}
