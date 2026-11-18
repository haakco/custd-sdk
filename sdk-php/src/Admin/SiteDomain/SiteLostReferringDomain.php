<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteLostReferringDomain is one domain that stopped linking; harmonicRank is null when it was unranked. */
final readonly class SiteLostReferringDomain
{
    public function __construct(
        public string $domain,
        public ?int $harmonicRank = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domain'),
            Fields::optionalInteger($payload, 'harmonicRank'),
        );
    }
}
