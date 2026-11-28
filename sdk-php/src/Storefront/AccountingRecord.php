<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingRecord
{
    public function __construct(
        public AccountingRecordKind $kind,
        public string $recordUuid,
        public string $postedOn,
        public ?string $appUuid = null,
        public ?string $invoiceUuid = null,
        public ?string $invoiceNumber = null,
        public ?string $buyerCompanyUuid = null,
        public ?AccountingDocument $document = null,
        public ?AccountingPayment $paymentAllocation = null,
        public ?AccountingRefund $refund = null,
        public ?AccountingMovement $partnerMovement = null,
        public ?AccountingPayout $partnerPayout = null,
        public ?AccountingSetOff $partnerSetOff = null,
        public ?AccountingProjectionGap $partnerProjectionGap = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $document = Fields::optionalObject($payload, 'document');
        $paymentAllocation = Fields::optionalObject($payload, 'paymentAllocation');
        $refund = Fields::optionalObject($payload, 'refund');
        $partnerMovement = Fields::optionalObject($payload, 'partnerMovement');
        $partnerPayout = Fields::optionalObject($payload, 'partnerPayout');
        $partnerSetOff = Fields::optionalObject($payload, 'partnerSetOff');
        $partnerProjectionGap = Fields::optionalObject($payload, 'partnerProjectionGap');

        return new self(
            AccountingRecordKind::from(Fields::string($payload, 'kind')),
            Fields::string($payload, 'recordUuid'),
            Fields::string($payload, 'postedOn'),
            Fields::optionalString($payload, 'appUuid'),
            Fields::optionalString($payload, 'invoiceUuid'),
            Fields::optionalString($payload, 'invoiceNumber'),
            Fields::optionalString($payload, 'buyerCompanyUuid'),
            $document === null ? null : AccountingDocument::fromPayload($document),
            $paymentAllocation === null ? null : AccountingPayment::fromPayload($paymentAllocation),
            $refund === null ? null : AccountingRefund::fromPayload($refund),
            $partnerMovement === null ? null : AccountingMovement::fromPayload($partnerMovement),
            $partnerPayout === null ? null : AccountingPayout::fromPayload($partnerPayout),
            $partnerSetOff === null ? null : AccountingSetOff::fromPayload($partnerSetOff),
            $partnerProjectionGap === null ? null : AccountingProjectionGap::fromPayload($partnerProjectionGap),
        );
    }
}
