<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDashboardTenant
{
    public function __construct(
        public string $companySlug,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
        );
    }
}
