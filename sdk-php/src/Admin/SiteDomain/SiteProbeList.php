<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteProbeList
{
    /** @param list<SiteProbe> $probes */
    public function __construct(public array $probes)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(SiteProbe::fromPayload(...), Fields::objects($payload, 'probes')));
    }
}
