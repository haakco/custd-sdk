<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class DashboardCatalogueTrust
{
    public function __construct(
        public bool $serverOwned,
        public bool $tenantScoped,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'serverOwned'),
            Fields::boolean($payload, 'tenantScoped'),
        );
    }
}
