<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTrafficCoverage counts the expected hours of a range by how far their access logs were read. */
final readonly class SiteTrafficCoverage
{
    public function __construct(
        public int $hoursExpected,
        public int $hoursRead,
        public int $hoursPartial,
        public int $hoursFailed,
        public int $hoursMissing,
        public bool $complete,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'hoursExpected'),
            Fields::integer($payload, 'hoursRead'),
            Fields::integer($payload, 'hoursPartial'),
            Fields::integer($payload, 'hoursFailed'),
            Fields::integer($payload, 'hoursMissing'),
            Fields::boolean($payload, 'complete'),
        );
    }
}
