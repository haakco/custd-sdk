<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingProjectionGap
{
    public function __construct(
        public string $outcome,
        public ?string $failureCode = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'outcome'),
            Fields::optionalString($payload, 'failureCode'),
        );
    }
}
