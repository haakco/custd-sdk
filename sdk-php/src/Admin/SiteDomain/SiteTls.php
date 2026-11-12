<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteTls is the latest certificate check. lastFailure says why the certificate
 * is not valid, or why the check could not reach the host.
 */
final readonly class SiteTls
{
    public function __construct(
        public ?string $lastCheckedAt = null,
        public ?string $validTo = null,
        public ?string $issuer = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'lastCheckedAt'),
            Fields::optionalString($payload, 'validTo'),
            Fields::optionalString($payload, 'issuer'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
