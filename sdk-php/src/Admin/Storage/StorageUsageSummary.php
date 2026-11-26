<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Provisioning\StorageMeasurementState;

final readonly class StorageUsageSummary
{
    /**
     * @param list<TenantStorageUsage> $tenants
     */
    public function __construct(
        public int $attributedStorageBytes,
        public int $effectiveLimitBytes,
        public string $measuredAt,
        public StorageMeasurementState $measurementState,
        public float $percentUsed,
        public int $remainingBytes,
        public int $retainedEventCount,
        public int $retainedLogicalBytes,
        public int $tenantCount,
        public array $tenants,
        public bool $warning,
        public string $warningState,
        public ?StorageUsageBreakdown $breakdown = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $breakdown = Fields::optionalObject($payload, 'breakdown');

        return new self(
            Fields::integer($payload, 'attributedStorageBytes'),
            Fields::integer($payload, 'effectiveLimitBytes'),
            Fields::string($payload, 'measuredAt'),
            StorageMeasurementState::fromPayload(Fields::object($payload, 'measurementState')),
            Fields::number($payload, 'percentUsed'),
            Fields::integer($payload, 'remainingBytes'),
            Fields::integer($payload, 'retainedEventCount'),
            Fields::integer($payload, 'retainedLogicalBytes'),
            Fields::integer($payload, 'tenantCount'),
            array_map(TenantStorageUsage::fromPayload(...), Fields::objects($payload, 'tenants')),
            Fields::boolean($payload, 'warning'),
            Fields::string($payload, 'warningState'),
            $breakdown === null ? null : StorageUsageBreakdown::fromPayload($breakdown),
        );
    }
}
