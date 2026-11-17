<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportSpeed
{
    public function __construct(
        public SiteLighthouseProfile $profile,
        public string $observedAt,
        public SiteLighthouseScores $scores,
        public SiteLighthouseMetrics $metrics,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteLighthouseProfile::from(Fields::string($payload, 'profile')),
            Fields::string($payload, 'observedAt'),
            SiteLighthouseScores::fromPayload(Fields::object($payload, 'scores')),
            SiteLighthouseMetrics::fromPayload(Fields::object($payload, 'metrics')),
        );
    }
}
