<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageCertificate
{
    public function __construct(
        public string $enrollmentUuid,
        public string $closedAt,
        public UsagePricedLine $line,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'enrollmentUuid'),
            Fields::string($payload, 'closedAt'),
            UsagePricedLine::fromPayload(Fields::object($payload, 'line')),
        );
    }
}
