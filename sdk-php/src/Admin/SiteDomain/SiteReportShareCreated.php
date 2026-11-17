<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportShareCreated
{
    public function __construct(
        public SiteReportShare $share,
        public string $token,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteReportShare::fromPayload(Fields::object($payload, 'share')),
            Fields::string($payload, 'token'),
        );
    }
}
