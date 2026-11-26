<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class DashboardCatalogueResponse
{
    /**
     * @param list<DashboardCatalogueEntry> $dashboards
     */
    public function __construct(
        public array $dashboards,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DashboardCatalogueEntry::fromPayload(...), Fields::objects($payload, 'dashboards')),
        );
    }
}
