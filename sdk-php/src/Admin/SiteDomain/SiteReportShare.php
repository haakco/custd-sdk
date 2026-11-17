<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportShare
{
    public function __construct(
        public string $shareUuid,
        public string $createdAt,
        public string $expiresAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'shareUuid'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'expiresAt'),
        );
    }
}
