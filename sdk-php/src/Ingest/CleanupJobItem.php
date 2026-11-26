<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupJobItem is one phase of a cleanup job.
 */
final readonly class CleanupJobItem
{
    public function __construct(
        public int $id,
        public int $jobId,
        public string $phase,
        public string $dataClass,
        public string $storagePrefix,
        public int $selectedCount,
        public int $selectedBytes,
        public int $deletedCount,
        public int $verifiedCount,
        public string $status,
        public ?string $failureReason = null,
        public ?CleanupObjectProgress $objectProgress = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $objectProgress = Fields::optionalObject($payload, 'objectProgress');

        return new self(
            Fields::integer($payload, 'id'),
            Fields::integer($payload, 'jobId'),
            Fields::string($payload, 'phase'),
            Fields::string($payload, 'dataClass'),
            Fields::string($payload, 'storagePrefix'),
            Fields::integer($payload, 'selectedCount'),
            Fields::integer($payload, 'selectedBytes'),
            Fields::integer($payload, 'deletedCount'),
            Fields::integer($payload, 'verifiedCount'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'failureReason'),
            $objectProgress === null ? null : CleanupObjectProgress::fromPayload($objectProgress),
        );
    }
}
