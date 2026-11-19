<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteAIPlatformUsage
{
    public function __construct(
        public SiteAIUsage $usage,
        public int $samplingMonthlyCapUsdMicros,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteAIUsage::fromPayload($payload),
            Fields::integer($payload, 'samplingMonthlyCapUsdMicros'),
        );
    }
}
