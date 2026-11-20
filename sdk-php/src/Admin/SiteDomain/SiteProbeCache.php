<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteProbeCache
{
    public function __construct(
        public ?string $cacheControl,
        public ?string $age,
        public ?string $cacheStatus,
        public ?string $server,
        public ?string $via,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'cacheControl'),
            Fields::optionalString($payload, 'age'),
            Fields::optionalString($payload, 'cacheStatus'),
            Fields::optionalString($payload, 'server'),
            Fields::optionalString($payload, 'via'),
        );
    }
}
