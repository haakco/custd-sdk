<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteLighthouseMetrics
{
    public function __construct(
        public ?int $firstContentfulPaintMs = null,
        public ?int $largestContentfulPaintMs = null,
        public ?int $totalBlockingTimeMs = null,
        public ?int $speedIndexMs = null,
        public ?float $cumulativeLayoutShift = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalInteger($payload, 'firstContentfulPaintMs'),
            Fields::optionalInteger($payload, 'largestContentfulPaintMs'),
            Fields::optionalInteger($payload, 'totalBlockingTimeMs'),
            Fields::optionalInteger($payload, 'speedIndexMs'),
            Fields::optionalNumber($payload, 'cumulativeLayoutShift'),
        );
    }
}
