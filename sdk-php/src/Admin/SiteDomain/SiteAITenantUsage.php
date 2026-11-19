<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteAITenantUsage
{
    public function __construct(
        public SiteAIUsage $usage,
        public SiteAIMode $aiMode,
        public int $monthlyCapUsdMicros,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteAIUsage::fromPayload($payload),
            SiteAIMode::from(Fields::string($payload, 'aiMode')),
            Fields::integer($payload, 'monthlyCapUsdMicros'),
        );
    }
}
