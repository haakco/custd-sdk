<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Receipt
{
    public function __construct(
        public string $receiptUuid,
        public string $receiptNumber,
        public string $invoiceUuid,
        public string $paymentUuid,
        public string $issuedAt,
        public Money $amountReceived,
        public ReceiptDelivery $delivery,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'receiptUuid'),
            Fields::string($payload, 'receiptNumber'),
            Fields::string($payload, 'invoiceUuid'),
            Fields::string($payload, 'paymentUuid'),
            Fields::string($payload, 'issuedAt'),
            Money::fromPayload(Fields::object($payload, 'amountReceived')),
            ReceiptDelivery::fromPayload(Fields::object($payload, 'delivery')),
        );
    }
}
