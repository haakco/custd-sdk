<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageSchedule
{
    public function __construct(
        public string $enrollmentUuid,
        public UsageScheduleState $state,
        public string $consentedAt,
        public int $attempts,
        public ?InvoiceNotice $invoiceNotice = null,
        public ?string $nextAttemptAt = null,
        public ?string $completedAt = null,
        public ?string $invoiceUuid = null,
        public ?string $reason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $invoiceNotice = Fields::optionalObject($payload, 'invoiceNotice');

        return new self(
            Fields::string($payload, 'enrollmentUuid'),
            UsageScheduleState::from(Fields::string($payload, 'state')),
            Fields::string($payload, 'consentedAt'),
            Fields::integer($payload, 'attempts'),
            $invoiceNotice === null ? null : InvoiceNotice::fromPayload($invoiceNotice),
            Fields::optionalString($payload, 'nextAttemptAt'),
            Fields::optionalString($payload, 'completedAt'),
            Fields::optionalString($payload, 'invoiceUuid'),
            Fields::optionalString($payload, 'reason'),
        );
    }
}
