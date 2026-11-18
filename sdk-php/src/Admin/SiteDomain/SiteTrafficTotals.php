<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTrafficTotals sums the range; p95Ms is null without a request. */
final readonly class SiteTrafficTotals
{
    public function __construct(
        public int $requests,
        public int $bytes,
        public int $notFound,
        public ?int $p95Ms = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'requests'),
            Fields::integer($payload, 'bytes'),
            Fields::integer($payload, 'notFound'),
            Fields::optionalInteger($payload, 'p95Ms'),
        );
    }
}
