<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteSearchImpactWindow is the UTC days from..to (YYYY-MM-DD) of one side of a fix. */
final readonly class SiteSearchImpactWindow
{
    public function __construct(
        public string $from,
        public string $to,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'from'),
            Fields::string($payload, 'to'),
        );
    }
}
