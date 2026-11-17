<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportShareList
{
    /**
     * @param list<SiteReportShare> $shares
     */
    public function __construct(
        public array $shares,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SiteReportShare::fromPayload(...), Fields::objects($payload, 'shares')),
        );
    }
}
