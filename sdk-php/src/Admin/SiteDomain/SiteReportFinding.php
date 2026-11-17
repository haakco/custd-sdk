<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportFinding
{
    public function __construct(
        public string $severity,
        public string $title,
        public string $url,
        public string $fix,
        public string $firstSeenAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'severity'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'fix'),
            Fields::string($payload, 'firstSeenAt'),
        );
    }
}
