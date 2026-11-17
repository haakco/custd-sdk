<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageCheckResponse is what the one-page checks found on a draft, with the draft's facts. */
final readonly class SitePageCheckResponse
{
    /** @param list<SitePageFinding> $findings */
    public function __construct(
        public SitePageFacts $page,
        public array $findings,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SitePageFacts::fromPayload(Fields::object($payload, 'page')),
            array_map(SitePageFinding::fromPayload(...), Fields::objects($payload, 'findings')),
        );
    }
}
