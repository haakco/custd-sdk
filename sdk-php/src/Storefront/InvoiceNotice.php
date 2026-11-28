<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class InvoiceNotice
{
    public function __construct(
        public InvoiceNoticeStatus $status,
        public ?InvoiceNoticeReason $reason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $reason = Fields::optionalString($payload, 'reason');

        return new self(
            InvoiceNoticeStatus::from(Fields::string($payload, 'status')),
            $reason === null ? null : InvoiceNoticeReason::from($reason),
        );
    }
}
