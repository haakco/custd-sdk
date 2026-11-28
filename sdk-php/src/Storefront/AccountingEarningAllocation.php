<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingEarningAllocation
{
    public function __construct(
        public string $earningMovementUuid,
        public string $amountMinor,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'earningMovementUuid'),
            Fields::string($payload, 'amountMinor'),
        );
    }
}
