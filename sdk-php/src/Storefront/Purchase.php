<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Purchase
{
    public function __construct(
        public string $invoiceUuid,
        public string $invoiceNumber,
        public string $status,
        public Totals $totals,
        public ?string $checkoutState,
        public ?string $paymentStatus,
        public ?string $paymentUrl,
        public ?Receipt $receipt,
        public ?CreditNote $creditNote,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'invoiceUuid'),
            Fields::string($payload, 'invoiceNumber'),
            Fields::string($payload, 'status'),
            Totals::fromPayload(Fields::object($payload, 'totals')),
            Fields::optionalString($payload, 'checkoutState'),
            Fields::optionalString($payload, 'paymentStatus'),
            Fields::optionalString($payload, 'paymentUrl'),
            ($record = Fields::optionalObject($payload, 'receipt')) === null ? null : Receipt::fromPayload($record),
            ($record = Fields::optionalObject($payload, 'creditNote')) === null ? null : CreditNote::fromPayload($record),
        );
    }
}
