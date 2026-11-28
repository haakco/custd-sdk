<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageEnrollment
{
    public function __construct(
        public string $enrollmentUuid,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'enrollmentUuid'),
        );
    }
}
