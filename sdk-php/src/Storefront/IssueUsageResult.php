<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class IssueUsageResult
{
    public function __construct(
        public UsageIssuanceStatus $status,
        public UsageCertificate $usage,
        public ?UsageIssuedInvoice $invoice = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        $invoice = Fields::optionalObject($payload, 'invoice');

        return new self(
            UsageIssuanceStatus::from(Fields::string($payload, 'status')),
            UsageCertificate::fromPayload(Fields::object($payload, 'usage')),
            $invoice === null ? null : UsageIssuedInvoice::fromPayload($invoice),
        );
    }
}
