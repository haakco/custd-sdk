<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class TenantOffboardingPreviewItem
{
    public function __construct(
        public int $estimatedCount,
        public string $kind,
        public string $retentionClass,
        public string $store,
        public ?string $sourceAuthority = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'estimated_count'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'retention_class'),
            Fields::string($payload, 'store'),
            Fields::optionalString($payload, 'source_authority'),
        );
    }
}
