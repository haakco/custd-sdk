<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PurchaseHandoff
{
    public function __construct(
        public string $handoffUuid,
        public string $orderReference,
        public string $offerUuid,
        public Money $amount,
        public string $checkoutPath,
        public string $expiresAt,
        public ?string $invoiceUuid,
        public bool $settled,
        public bool $cancelled = false,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'handoffUuid'),
            Fields::string($payload, 'orderReference'),
            Fields::string($payload, 'offerUuid'),
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::string($payload, 'checkoutPath'),
            Fields::string($payload, 'expiresAt'),
            Fields::optionalString($payload, 'invoiceUuid'),
            Fields::boolean($payload, 'settled'),
            Fields::optionalBoolean($payload, 'cancelled') ?? false,
        );
    }
}
