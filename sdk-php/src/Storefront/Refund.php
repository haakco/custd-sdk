<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Refund
{
    public function __construct(
        public string $refundUuid,
        public string $status,
        public Money $amount,
        public ?string $invoiceUuid = null,
        public ?string $paymentUuid = null,
        public ?string $requestedAt = null,
        public ?string $processedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'refundUuid'),
            Fields::string($payload, 'status'),
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::optionalString($payload, 'invoiceUuid'),
            Fields::optionalString($payload, 'paymentUuid'),
            Fields::optionalString($payload, 'requestedAt'),
            Fields::optionalString($payload, 'processedAt'),
        );
    }
}
