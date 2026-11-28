<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingPayment
{
    public function __construct(
        public Money $amount,
        public string $verifiedAt,
        public string $provider,
        public string $providerReference,
        public AccountingPostingBasis $postingBasis,
        public ?string $providerReceivedAt = null,
        public ?string $providerAccountUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::string($payload, 'verifiedAt'),
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'providerReference'),
            AccountingPostingBasis::from(Fields::string($payload, 'postingBasis')),
            Fields::optionalString($payload, 'providerReceivedAt'),
            Fields::optionalString($payload, 'providerAccountUuid'),
        );
    }
}
