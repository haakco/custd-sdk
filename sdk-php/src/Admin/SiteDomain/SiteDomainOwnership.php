<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteDomainOwnership is the proof of control and what the last check saw. */
final readonly class SiteDomainOwnership
{
    public function __construct(
        public bool $verified,
        public SiteDomainVerification $instructions,
        public ?string $verifiedAt = null,
        public ?string $verifiedBy = null,
        public ?string $lastCheckedAt = null,
        public ?string $lastCheckFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'verified'),
            SiteDomainVerification::fromPayload(Fields::object($payload, 'instructions')),
            Fields::optionalString($payload, 'verifiedAt'),
            Fields::optionalString($payload, 'verifiedBy'),
            Fields::optionalString($payload, 'lastCheckedAt'),
            Fields::optionalString($payload, 'lastCheckFailure'),
        );
    }
}
