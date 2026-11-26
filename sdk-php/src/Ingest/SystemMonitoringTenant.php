<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class SystemMonitoringTenant
{
    public function __construct(
        public string $companySlug,
        public string $companyName,
        public string $rankReason,
        public int $attributedStorageBytes,
        public int $effectiveLimitBytes,
        public float $percentUsed,
        public ?int $rejectedEvents = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'companyName'),
            Fields::string($payload, 'rankReason'),
            Fields::integer($payload, 'attributedStorageBytes'),
            Fields::integer($payload, 'effectiveLimitBytes'),
            Fields::number($payload, 'percentUsed'),
            Fields::optionalInteger($payload, 'rejectedEvents'),
        );
    }
}
