<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class SellerInvoiceItem
{
    public function __construct(
        public string $invoiceUuid,
        public string $invoiceNumber,
        public string $issuedAt,
        public Totals $totals,
        public InvoiceStatus $status,
        public ?PaymentStatus $paymentStatus = null,
        public ?CheckoutState $checkoutState = null,
        public ?string $refundStatus = null,
        public ?string $creditNoteUuid = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        $paymentStatus = Fields::optionalString($payload, 'paymentStatus');
        $checkoutState = Fields::optionalString($payload, 'checkoutState');

        return new self(
            Fields::string($payload, 'invoiceUuid'),
            Fields::string($payload, 'invoiceNumber'),
            Fields::string($payload, 'issuedAt'),
            Totals::fromPayload(Fields::object($payload, 'totals')),
            InvoiceStatus::from(Fields::string($payload, 'status')),
            $paymentStatus === null ? null : PaymentStatus::from($paymentStatus),
            $checkoutState === null ? null : CheckoutState::from($checkoutState),
            Fields::optionalString($payload, 'refundStatus'),
            Fields::optionalString($payload, 'creditNoteUuid'),
        );
    }
}
