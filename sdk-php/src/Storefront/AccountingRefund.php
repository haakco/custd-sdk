<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingRefund
{
    public function __construct(
        public Money $amount,
        public string $paymentUuid,
        public string $processedAt,
        public string $provider,
        public string $providerReference,
        public ?string $providerAccountUuid = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::string($payload, 'paymentUuid'),
            Fields::string($payload, 'processedAt'),
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'providerReference'),
            Fields::optionalString($payload, 'providerAccountUuid'),
        );
    }
}
