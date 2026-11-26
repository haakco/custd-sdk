<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemStatusResponse
{
    /**
     * @param list<SystemStageStatus> $stages
     * @param list<SystemTenantHotspot> $topTenants
     */
    public function __construct(
        public string $generatedAt,
        public SystemStatusKPIs $kpis,
        public string $overallStatus,
        public SystemRealmCapacity $realmCapacity,
        public array $stages,
        public SystemStorageStatus $storage,
        public OperationalSummary $summary,
        public array $topTenants,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'generatedAt'),
            SystemStatusKPIs::fromPayload(Fields::object($payload, 'kpis')),
            Fields::string($payload, 'overallStatus'),
            SystemRealmCapacity::fromPayload(Fields::object($payload, 'realmCapacity')),
            array_map(SystemStageStatus::fromPayload(...), Fields::objects($payload, 'stages')),
            SystemStorageStatus::fromPayload(Fields::object($payload, 'storage')),
            OperationalSummary::fromPayload(Fields::object($payload, 'summary')),
            array_map(SystemTenantHotspot::fromPayload(...), Fields::objects($payload, 'topTenants')),
        );
    }
}
