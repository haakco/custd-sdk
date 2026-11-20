<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteProbeTimings
{
    public function __construct(
        public ?int $dnsMs,
        public ?int $connectMs,
        public ?int $tlsMs,
        public ?int $firstByteMs,
        public int $totalMs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalInteger($payload, 'dnsMs'),
            Fields::optionalInteger($payload, 'connectMs'),
            Fields::optionalInteger($payload, 'tlsMs'),
            Fields::optionalInteger($payload, 'firstByteMs'),
            Fields::integer($payload, 'totalMs'),
        );
    }
}
