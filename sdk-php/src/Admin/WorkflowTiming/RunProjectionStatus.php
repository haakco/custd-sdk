<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** RunProjectionStatus is the visible projection state of one observed run. */
final readonly class RunProjectionStatus
{
    public function __construct(
        public string $state = '',
        public int $projectedLedgerId = 0,
        public int $latestLedgerId = 0,
        public int $pendingFacts = 0,
        public string $foldError = '',
        public bool $healthy = true,
        public string $nextAction = 'none',
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'state'),
            Payload::integer($payload, 'projectedLedgerId'),
            Payload::integer($payload, 'latestLedgerId'),
            Payload::integer($payload, 'pendingFacts'),
            Payload::optionalString($payload, 'foldError') ?? '',
            Payload::boolean($payload, 'healthy'),
            Payload::string($payload, 'nextAction'),
        );
    }
}
