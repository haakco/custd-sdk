<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTrafficSlowPath is one of the paths with the slowest 95th percentile response time. */
final readonly class SiteTrafficSlowPath
{
    public function __construct(
        public string $path,
        public int $requests,
        public int $p95Ms,
        public int $maxMs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'path'),
            Fields::integer($payload, 'requests'),
            Fields::integer($payload, 'p95Ms'),
            Fields::integer($payload, 'maxMs'),
        );
    }
}
