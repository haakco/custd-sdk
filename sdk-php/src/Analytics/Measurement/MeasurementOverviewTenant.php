<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementOverviewTenant
{
    public function __construct(
        public string $companySlug,
        public string $label,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'label'),
        );
    }
}
