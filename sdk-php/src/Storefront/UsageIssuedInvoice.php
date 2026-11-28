<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageIssuedInvoice
{
    /**
     * @param  list<QuoteLine>  $lines
     */
    public function __construct(
        public string $invoiceUuid,
        public string $invoiceNumber,
        public InvoiceStatus $status,
        public string $issuedAt,
        public Totals $totals,
        public array $lines,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'invoiceUuid'),
            Fields::string($payload, 'invoiceNumber'),
            InvoiceStatus::from(Fields::string($payload, 'status')),
            Fields::string($payload, 'issuedAt'),
            Totals::fromPayload(Fields::object($payload, 'totals')),
            array_map(QuoteLine::fromPayload(...), Fields::optionalObjects($payload, 'lines') ?? []),
        );
    }
}
