<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * SystemMonitoringSummary is the platform-wide monitoring view and the tenants nearest their limits; system
 * administrators only.
 */
final readonly class SystemMonitoringSummary
{
    /**
     * @param list<SystemMonitoringTenant> $topTenants
     */
    public function __construct(
        public string $generatedAt,
        public SystemMonitoringTotals $totals,
        public array $topTenants,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'generatedAt'),
            SystemMonitoringTotals::fromPayload(Fields::object($payload, 'totals')),
            array_map(SystemMonitoringTenant::fromPayload(...), Fields::objects($payload, 'topTenants')),
        );
    }
}
