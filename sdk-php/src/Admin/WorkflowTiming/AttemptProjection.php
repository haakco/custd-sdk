<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * AttemptProjection is one projected step attempt. A running attempt has no
 * finish time, which is why both ends are nullable rather than defaulted.
 */
final readonly class AttemptProjection
{
    public function __construct(
        public string $stepKey = '',
        public int $attempt = 0,
        public string $state = '',
        public ?string $startedAt = null,
        public ?string $finishedAt = null,
        public string $errorClass = '',
        public string $occurredAt = '',
        public string $receiptAt = '',
    ) {
    }

    public function isOpen(): bool
    {
        return $this->finishedAt === null;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'stepKey'),
            Payload::integer($payload, 'attempt'),
            Payload::string($payload, 'state'),
            Payload::optionalString($payload, 'startedAt'),
            Payload::optionalString($payload, 'finishedAt'),
            Payload::optionalString($payload, 'errorClass') ?? '',
            Payload::string($payload, 'occurredAt'),
            Payload::string($payload, 'receiptAt'),
        );
    }
}
