<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteDomainAttestation is the credential that vouched for the domain's ownership, and when. */
final readonly class SiteDomainAttestation
{
    public function __construct(
        public string $clientId,
        public string $attestedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'clientId'), Fields::string($payload, 'attestedAt'));
    }
}
