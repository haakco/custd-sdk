<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageSource
{
    public function __construct(
        public string $accountCompanyUuid,
        public UsageMeter $meter,
        public ?string $dataSpaceCompanyUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'accountCompanyUuid'),
            UsageMeter::fromPayload(Fields::object($payload, 'meter')),
            Fields::optionalString($payload, 'dataSpaceCompanyUuid'),
        );
    }
}
