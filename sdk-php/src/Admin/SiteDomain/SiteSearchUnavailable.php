<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteSearchUnavailable is a provider that cannot report a dimension: no data, not zero traffic. */
final readonly class SiteSearchUnavailable
{
    public function __construct(
        public SiteSearchProvider $provider,
        public string $reason,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteSearchProvider::from(Fields::string($payload, 'provider')),
            Fields::string($payload, 'reason'),
        );
    }
}
