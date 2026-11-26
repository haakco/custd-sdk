<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemTenantHotspot
{
    public function __construct(
        public int $attributedStorageBytes,
        public string $companyName,
        public string $companySlug,
        public int $effectiveLimitBytes,
        public float $percentUsed,
        public int $retainedLogicalBytes,
        public string $warningState,
        public ?int $claimQueued = null,
        public ?string $rankReason = null,
        public ?int $rejectedEvents = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'attributedStorageBytes'),
            Fields::string($payload, 'companyName'),
            Fields::string($payload, 'companySlug'),
            Fields::integer($payload, 'effectiveLimitBytes'),
            Fields::number($payload, 'percentUsed'),
            Fields::integer($payload, 'retainedLogicalBytes'),
            Fields::string($payload, 'warningState'),
            Fields::optionalInteger($payload, 'claimQueued'),
            Fields::optionalString($payload, 'rankReason'),
            Fields::optionalInteger($payload, 'rejectedEvents'),
        );
    }
}
