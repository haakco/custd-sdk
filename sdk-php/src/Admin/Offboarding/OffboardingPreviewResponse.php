<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class OffboardingPreviewResponse
{
    /**
     * @param list<TenantOffboardingPreviewItem> $stores
     * @param list<TenantOffboardingExclusion> $exclusions
     */
    public function __construct(
        public bool $complete,
        public string $expiresAt,
        public string $generatedAt,
        public bool $partial,
        public string $previewInventoryDigest,
        public string $requestUuid,
        public array $stores,
        public array $exclusions = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'complete'),
            Fields::string($payload, 'expiresAt'),
            Fields::string($payload, 'generatedAt'),
            Fields::boolean($payload, 'partial'),
            Fields::string($payload, 'previewInventoryDigest'),
            Fields::string($payload, 'requestUuid'),
            array_map(TenantOffboardingPreviewItem::fromPayload(...), Fields::objects($payload, 'stores')),
            array_map(TenantOffboardingExclusion::fromPayload(...), Fields::optionalObjects($payload, 'exclusions') ?? []),
        );
    }
}
