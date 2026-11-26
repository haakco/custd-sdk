<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteFindingDismissalList is a domain's active finding dismissals. */
final readonly class SiteFindingDismissalList
{
    /** @param list<SiteFindingDismissal> $dismissals */
    public function __construct(public array $dismissals = [])
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(SiteFindingDismissal::fromPayload(...), Fields::objects($payload, 'dismissals')));
    }
}
