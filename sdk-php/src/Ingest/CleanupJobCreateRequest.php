<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

/**
 * CleanupJobCreateRequest enqueues a scoped cleanup job. An unset tenantSlug uses the credential's tenant.
 */
final readonly class CleanupJobCreateRequest
{
    /**
     * @param list<string> $approvedS3Prefixes
     * @param list<CleanupJetStreamSelection>|null $jetStream
     */
    public function __construct(
        public string $mode,
        public string $reason,
        public array $approvedS3Prefixes,
        public CleanupApproval $approval,
        public ?string $tenantSlug = null,
        public ?string $eventTypeSlug = null,
        public ?string $startedAt = null,
        public ?string $endedAt = null,
        public ?array $jetStream = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'mode' => $this->mode,
            'reason' => $this->reason,
            'approvedS3Prefixes' => $this->approvedS3Prefixes,
            'approval' => $this->approval->serialise(),
        ];
        if ($this->tenantSlug !== null) {
            $body['tenantSlug'] = $this->tenantSlug;
        }
        if ($this->eventTypeSlug !== null) {
            $body['eventTypeSlug'] = $this->eventTypeSlug;
        }
        if ($this->startedAt !== null) {
            $body['startedAt'] = $this->startedAt;
        }
        if ($this->endedAt !== null) {
            $body['endedAt'] = $this->endedAt;
        }
        if ($this->jetStream !== null) {
            $body['jetStream'] = array_map(static fn (CleanupJetStreamSelection $item): array => $item->serialise(), $this->jetStream);
        }

        return $body;
    }
}
