<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteAITenantUsage
{
    /**
     * @param SiteAIMode::* $aiMode
     */
    public function __construct(
        public SiteAIUsage $usage,
        public string $aiMode,
        public int $monthlyCapUsdMicros,
        public ?int $monthlyCapUsedUsdMicros = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteAIUsage::fromPayload($payload),
            Fields::string($payload, 'aiMode'),
            Fields::integer($payload, 'monthlyCapUsdMicros'),
            Fields::optionalInteger($payload, 'monthlyCapUsedUsdMicros'),
        );
    }
}
