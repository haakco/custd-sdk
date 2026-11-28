<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class CreditNote
{
    /**
     * @param  list<QuoteLine>|null  $lines
     */
    public function __construct(
        public string $creditNoteUuid,
        public string $creditNoteNumber,
        public Totals $totals,
        public ?string $invoiceUuid,
        public ?string $invoiceNumber,
        public ?string $invoiceIssuedAt,
        public ?string $issuedAt,
        public ?string $status,
        public ?BillingContact $billTo,
        public ?string $sellerName,
        public ?string $reason,
        public ?array $lines,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'creditNoteUuid'),
            Fields::string($payload, 'creditNoteNumber'),
            Totals::fromPayload(Fields::object($payload, 'totals')),
            Fields::optionalString($payload, 'invoiceUuid'),
            Fields::optionalString($payload, 'invoiceNumber'),
            Fields::optionalString($payload, 'invoiceIssuedAt'),
            Fields::optionalString($payload, 'issuedAt'),
            Fields::optionalString($payload, 'status'),
            ($record = Fields::optionalObject($payload, 'billTo')) === null ? null : BillingContact::fromPayload($record),
            Fields::optionalString($payload, 'sellerName'),
            Fields::optionalString($payload, 'reason'),
            ($items = Fields::optionalObjects($payload, 'lines')) === null ? null : array_map(QuoteLine::fromPayload(...), $items),
        );
    }
}
