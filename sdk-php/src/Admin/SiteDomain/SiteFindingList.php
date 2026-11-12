<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteFindingList is a domain's findings, most severe first. */
final readonly class SiteFindingList
{
    /** @param list<SiteFinding> $findings */
    public function __construct(
        public array $findings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $findings = [];
        foreach (Fields::objects($payload, 'findings') as $finding) {
            $findings[] = SiteFinding::fromPayload($finding);
        }

        return new self($findings);
    }
}
