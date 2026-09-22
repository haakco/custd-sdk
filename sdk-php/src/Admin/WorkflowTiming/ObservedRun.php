<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * ObservedRun is the folded state of one observed run. The run, its attempts and
 * the revision it was folded against are read back from Custd, so a consumer never
 * has to reconstruct them.
 */
final readonly class ObservedRun
{
    /** @param array<string, string> $dimensions
     *  @param list<AttemptProjection> $attempts
     */
    public function __construct(
        public string $runUuid = '',
        public string $workflowKey = '',
        public string $workflowUuid = '',
        public string $revisionUuid = '',
        public int $revisionNumber = 0,
        public string $revisionHash = '',
        public string $externalRunId = '',
        public string $state = '',
        public ?string $startedAt = null,
        public ?string $finishedAt = null,
        public string $sourceOccurredAt = '',
        public string $receiptAt = '',
        public array $dimensions = [],
        public array $attempts = [],
        public RunProjectionStatus $projectionStatus = new RunProjectionStatus(),
    ) {
    }

    /**
     * projectionBehind reports whether observed facts are not folded into the
     * projection yet, which makes any duration read for the run not yet
     * trustworthy.
     */
    public function projectionBehind(): bool
    {
        return $this->projectionStatus->pendingFacts > 0;
    }

    /** attempt returns one projected step attempt. */
    public function attempt(string $stepKey, int $attempt = 1): ?AttemptProjection
    {
        foreach ($this->attempts as $projection) {
            if ($projection->stepKey === $stepKey && $projection->attempt === $attempt) {
                return $projection;
            }
        }
        return null;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'workflowUuid'),
            Payload::string($payload, 'revisionUuid'),
            Payload::integer($payload, 'revisionNumber'),
            Payload::string($payload, 'revisionHash'),
            Payload::string($payload, 'externalRunId'),
            Payload::string($payload, 'state'),
            Payload::optionalString($payload, 'startedAt'),
            Payload::optionalString($payload, 'finishedAt'),
            Payload::optionalString($payload, 'sourceOccurredAt') ?? '',
            Payload::string($payload, 'receiptAt'),
            array_map('strval', Payload::object($payload, 'dimensions')),
            array_map(
                static fn (array $item): AttemptProjection => AttemptProjection::fromPayload($item),
                Payload::objects($payload, 'attempts'),
            ),
            RunProjectionStatus::fromPayload(Payload::object($payload, 'projectionStatus')),
        );
    }
}
