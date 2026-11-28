<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class SellerInvoiceList
{
    /**
     * @param  list<SellerInvoiceItem>  $invoices
     */
    public function __construct(
        public array $invoices,
        public ?string $nextBefore = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SellerInvoiceItem::fromPayload(...), Fields::optionalObjects($payload, 'invoices') ?? []),
            Fields::optionalString($payload, 'nextBefore'),
        );
    }
}
