<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\AdminWorkflowException;
use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * BatchResult is the outcome of one append. It fails closed: a caller that reads
 * only the accepted count is told about the rejected items rather than being left
 * to notice them, and the rejection names each item and its machine code.
 */
final readonly class BatchResult
{
    /** @param list<ObservationResult> $results */
    public function __construct(
        public array $results = [],
        public int $accepted = 0,
        public int $rejected = 0,
        public int $duplicates = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            array_map(
                static fn (array $item): ObservationResult => ObservationResult::fromPayload($item),
                Payload::objects($payload, 'results'),
            ),
            Payload::integer($payload, 'accepted'),
            Payload::integer($payload, 'rejected'),
            Payload::integer($payload, 'duplicates'),
        );
    }

    /**
     * requireAccepted throws when any item was rejected. Callers that append
     * observed facts should use this rather than inspecting counts, because a 200
     * response with a rejected item is not a durable append.
     */
    public function requireAccepted(): self
    {
        if ($this->rejected === 0) {
            return $this;
        }
        $reasons = [];
        foreach ($this->results as $result) {
            if (!$result->accepted) {
                $reasons[] = sprintf('item %d (%s): %s', $result->index, $result->idempotencyKey, $result->errorCode);
            }
        }
        throw new AdminWorkflowException(
            422,
            sprintf(
                '%d of %d observations were rejected: %s',
                $this->rejected,
                count($this->results),
                implode('; ', $reasons),
            ),
            'workflow_timing_batch_rejected',
            'retry only the rejected items after correcting their facts',
        );
    }
}
