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
        public ?InvoiceNotice $invoiceNotice = null,
        public ?SetOff $setOff = null,
        public ?UsageCertificate $usage = null,
        public ?string $activationStatus = null,
        public ?Refund $refund = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        $invoiceNotice = Fields::optionalObject($payload, 'invoiceNotice');
        $setOff = Fields::optionalObject($payload, 'setOff');
        $usage = Fields::optionalObject($payload, 'usage');
        $refund = Fields::optionalObject($payload, 'refund');

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
            $invoiceNotice === null ? null : InvoiceNotice::fromPayload($invoiceNotice),
            $setOff === null ? null : SetOff::fromPayload($setOff),
            $usage === null ? null : UsageCertificate::fromPayload($usage),
            Fields::optionalString($payload, 'activationStatus'),
            $refund === null ? null : Refund::fromPayload($refund),
        );
    }
}
