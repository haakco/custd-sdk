<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupObjectProgress is how far an object-storage phase has deleted.
 */
final readonly class CleanupObjectProgress
{
    public function __construct(
        public string $sourceKind,
        public string $cursorDirection,
        public int $cursorId,
        public int $batchNumber,
        public int $ledgerSelectedCount,
        public int $providerAcknowledgedCount,
        public int $providerRequestCount,
        public int $providerFailureCount,
        public int $selectedBytes,
        public int $retryCount,
        public int $pendingBatchKeyCount,
        public string $lastProgressAt,
        public int $version,
        public ?string $cursorReceivedAt = null,
        public ?string $lastBatchIdentity = null,
        public ?string $pendingBatchIdentity = null,
        public ?int $pendingBatchAttemptCount = null,
        public ?bool $pendingBatchTerminal = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sourceKind'),
            Fields::string($payload, 'cursorDirection'),
            Fields::integer($payload, 'cursorId'),
            Fields::integer($payload, 'batchNumber'),
            Fields::integer($payload, 'ledgerSelectedCount'),
            Fields::integer($payload, 'providerAcknowledgedCount'),
            Fields::integer($payload, 'providerRequestCount'),
            Fields::integer($payload, 'providerFailureCount'),
            Fields::integer($payload, 'selectedBytes'),
            Fields::integer($payload, 'retryCount'),
            Fields::integer($payload, 'pendingBatchKeyCount'),
            Fields::string($payload, 'lastProgressAt'),
            Fields::integer($payload, 'version'),
            Fields::optionalString($payload, 'cursorReceivedAt'),
            Fields::optionalString($payload, 'lastBatchIdentity'),
            Fields::optionalString($payload, 'pendingBatchIdentity'),
            Fields::optionalInteger($payload, 'pendingBatchAttemptCount'),
            Fields::optionalBoolean($payload, 'pendingBatchTerminal'),
        );
    }
}
