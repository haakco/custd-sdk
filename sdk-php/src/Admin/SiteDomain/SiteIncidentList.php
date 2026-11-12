<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteIncidentList is a domain's recent outages, newest first. */
final readonly class SiteIncidentList
{
    /** @param list<SiteIncident> $incidents */
    public function __construct(
        public array $incidents = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $incidents = [];
        foreach (Fields::objects($payload, 'incidents') as $incident) {
            $incidents[] = SiteIncident::fromPayload($incident);
        }

        return new self($incidents);
    }
}
