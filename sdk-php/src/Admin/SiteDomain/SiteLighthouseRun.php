<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteLighthouseRun
{
    /**
     * @param SiteLighthouseProfile::* $profile
     * @param SiteLighthouseOutcome::* $outcome
     */
    public function __construct(
        public string $profile,
        public string $observedAt,
        public string $outcome,
        public string $url,
        public int $durationMs,
        public SiteLighthouseScores $scores,
        public SiteLighthouseMetrics $metrics,
        public ?string $failure = null,
        public ?string $toolVersion = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'profile'),
            Fields::string($payload, 'observedAt'),
            Fields::string($payload, 'outcome'),
            Fields::string($payload, 'url'),
            Fields::integer($payload, 'durationMs'),
            SiteLighthouseScores::fromPayload(Fields::object($payload, 'scores')),
            SiteLighthouseMetrics::fromPayload(Fields::object($payload, 'metrics')),
            Fields::optionalString($payload, 'failure'),
            Fields::optionalString($payload, 'toolVersion'),
        );
    }
}
