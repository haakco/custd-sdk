<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportCertificate
{
    public function __construct(
        public bool $problem,
        public ?string $validTo = null,
        public ?string $issuer = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'problem'),
            Fields::optionalString($payload, 'validTo'),
            Fields::optionalString($payload, 'issuer'),
        );
    }
}
