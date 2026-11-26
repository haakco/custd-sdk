<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteAIOwnerSettings is an owner session's tenant, the binding its writes carry and the tenant's AI settings. */
final readonly class SiteAIOwnerSettings
{
    public function __construct(
        public string $tenantSlug,
        public string $sessionBinding,
        public SiteAISettings $settings,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'tenantSlug'),
            Fields::string($payload, 'sessionBinding'),
            SiteAISettings::fromPayload(Fields::object($payload, 'settings')),
        );
    }
}
