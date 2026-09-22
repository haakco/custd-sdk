<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** RunSummary is one observed run in the bounded run list. */
final readonly class RunSummary
{
    public function __construct(
        public string $runUuid = '',
        public string $externalRunId = '',
        public string $workflowKey = '',
        public string $state = '',
        public ?string $startedAt = null,
        public ?string $finishedAt = null,
        public int $pendingFacts = 0,
        public int $openAttempts = 0,
        public string $receiptAt = '',
    ) {
    }

    public function projectionBehind(): bool
    {
        return $this->pendingFacts > 0;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::string($payload, 'externalRunId'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'state'),
            Payload::optionalString($payload, 'startedAt'),
            Payload::optionalString($payload, 'finishedAt'),
            Payload::integer($payload, 'pendingFacts'),
            Payload::integer($payload, 'openAttempts'),
            Payload::string($payload, 'receiptAt'),
        );
    }
}
