<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupJob is a cleanup job and its phases.
 */
final readonly class CleanupJob
{
    /**
     * @param list<CleanupJobItem> $items
     */
    public function __construct(
        public int $jobId,
        public string $jobUuid,
        public string $status,
        public string $tenantSlug,
        public string $scopeHash,
        public string $holdKind,
        public CleanupApproval $approval,
        public array $items,
        public string $createdAt,
        public ?string $failureReason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'jobId'),
            Fields::string($payload, 'jobUuid'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'tenantSlug'),
            Fields::string($payload, 'scopeHash'),
            Fields::string($payload, 'holdKind'),
            CleanupApproval::fromPayload(Fields::object($payload, 'approval')),
            array_map(CleanupJobItem::fromPayload(...), Fields::objects($payload, 'items')),
            Fields::string($payload, 'createdAt'),
            Fields::optionalString($payload, 'failureReason'),
        );
    }
}
