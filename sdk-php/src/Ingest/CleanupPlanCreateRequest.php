<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

/**
 * CleanupPlanCreateRequest asks for a generated-data cleanup plan. Times are RFC 3339.
 */
final readonly class CleanupPlanCreateRequest
{
    /**
     * @param list<string> $approvedS3Prefixes
     * @param list<CleanupJetStreamSelection> $jetStream
     */
    public function __construct(
        public string $mode,
        public string $reason,
        public bool $dryRun,
        public bool $execute,
        public string $approvedBy,
        public array $approvedS3Prefixes,
        public string $eventTypeSlug,
        public string $startedAt,
        public string $endedAt,
        public array $jetStream,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'mode' => $this->mode,
            'reason' => $this->reason,
            'dryRun' => $this->dryRun,
            'execute' => $this->execute,
            'approvedBy' => $this->approvedBy,
            'approvedS3Prefixes' => $this->approvedS3Prefixes,
            'eventTypeSlug' => $this->eventTypeSlug,
            'startedAt' => $this->startedAt,
            'endedAt' => $this->endedAt,
            'jetStream' => array_map(static fn (CleanupJetStreamSelection $item): array => $item->serialise(), $this->jetStream),
        ];

        return $body;
    }
}
