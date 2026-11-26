<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Admin\Tenant\StorageLimit;
use HaakCo\Custd\Fields;
use HaakCo\Custd\Provisioning\StorageMeasurementState;

final readonly class TenantStorageUsage
{
    public function __construct(
        public int $attributedStorageBytes,
        public string $companyName,
        public string $companySlug,
        public int $effectiveLimitBytes,
        public StorageLimit $limit,
        public string $measuredAt,
        public StorageMeasurementState $measurementState,
        public float $percentUsed,
        public int $remainingBytes,
        public int $retainedEventCount,
        public int $retainedLogicalBytes,
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
            Fields::string($payload, 'companyName'),
            Fields::string($payload, 'companySlug'),
            Fields::integer($payload, 'effectiveLimitBytes'),
            StorageLimit::fromPayload(Fields::object($payload, 'limit')),
            Fields::string($payload, 'measuredAt'),
            StorageMeasurementState::fromPayload(Fields::object($payload, 'measurementState')),
            Fields::number($payload, 'percentUsed'),
            Fields::integer($payload, 'remainingBytes'),
            Fields::integer($payload, 'retainedEventCount'),
            Fields::integer($payload, 'retainedLogicalBytes'),
            Fields::boolean($payload, 'warning'),
            Fields::string($payload, 'warningState'),
            $breakdown === null ? null : StorageUsageBreakdown::fromPayload($breakdown),
        );
    }
}
