<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** Wording overlap of two saved observations. An unread or unavailable page yields no comparison. */
final readonly class SiteObservedWording
{
    public function __construct(
        public SiteWordingObservation $first,
        public SiteWordingObservation $second,
        public ?SiteWordingCompare $comparison,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $comparison = Fields::optionalObject($payload, 'comparison');

        return new self(
            SiteWordingObservation::fromPayload(Fields::object($payload, 'first')),
            SiteWordingObservation::fromPayload(Fields::object($payload, 'second')),
            $comparison === null ? null : SiteWordingCompare::fromPayload($comparison),
        );
    }
}
