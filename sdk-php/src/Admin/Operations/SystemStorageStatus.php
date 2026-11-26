<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemStorageStatus
{
    public function __construct(
        public int $attributedStorageBytes,
        public int $effectiveLimitBytes,
        public string $measuredAt,
        public float $percentUsed,
        public int $retainedLogicalBytes,
        public int $tenantCount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'attributedStorageBytes'),
            Fields::integer($payload, 'effectiveLimitBytes'),
            Fields::string($payload, 'measuredAt'),
            Fields::number($payload, 'percentUsed'),
            Fields::integer($payload, 'retainedLogicalBytes'),
            Fields::integer($payload, 'tenantCount'),
        );
    }
}
