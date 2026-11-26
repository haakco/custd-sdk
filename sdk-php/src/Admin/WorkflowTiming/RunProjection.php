<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** RunProjection is the run state a rebuild folded from the run's ledger facts. */
final readonly class RunProjection
{
    /**
     * @param array<string, string> $dimensions
     * @param list<AttemptProjection> $attempts
     */
    public function __construct(
        public string $runUuid,
        public string $state,
        public bool $corrected,
        public string $receiptAt,
        public array $dimensions,
        public array $attempts,
        public int $appliedLedgerId,
        public int $openAttempts,
        public ?string $startedAt = null,
        public ?string $finishedAt = null,
        public ?string $occurredAt = null,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::string($payload, 'state'),
            Payload::boolean($payload, 'corrected'),
            Payload::string($payload, 'receiptAt'),
            array_map('strval', Payload::optionalObject($payload, 'dimensions') ?? []),
            array_map(AttemptProjection::fromPayload(...), Payload::objects($payload, 'attempts')),
            Payload::integer($payload, 'appliedLedgerId'),
            Payload::integer($payload, 'openAttempts'),
            Payload::optionalString($payload, 'startedAt'),
            Payload::optionalString($payload, 'finishedAt'),
            Payload::optionalString($payload, 'occurredAt'),
        );
    }
}
