<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Fields;

final readonly class PrivacyErasureResponse
{
    public function __construct(
        public int $affectedSegmentCount,
        public int $matchedEventCount,
        public int $redactedEventCount,
        public string $requestUuid,
        public string $selectorDisplay,
        public string $selectorType,
        public string $status,
        public ?string $archiveRecompactedAt = null,
        public ?string $createdAt = null,
        public ?int $failedRewriteCount = null,
        public ?string $forceRequestedAt = null,
        public ?string $latestFailureReason = null,
        public ?string $latestRecompactedAt = null,
        public ?string $oldestPendingRewriteAt = null,
        public ?int $pendingRewriteCount = null,
        public ?int $recompactedRewriteCount = null,
        public ?string $requestedBy = null,
        public ?int $rewriteCount = null,
        public ?int $rewritingRewriteCount = null,
        public ?int $rewrittenRewriteCount = null,
        public ?int $s3PropagationLagSeconds = null,
        public ?string $slaDeadlineAt = null,
        public ?string $slaState = null,
        public ?string $source = null,
        public ?string $updatedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'affectedSegmentCount'),
            Fields::integer($payload, 'matchedEventCount'),
            Fields::integer($payload, 'redactedEventCount'),
            Fields::string($payload, 'requestUuid'),
            Fields::string($payload, 'selectorDisplay'),
            Fields::string($payload, 'selectorType'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'archiveRecompactedAt'),
            Fields::optionalString($payload, 'createdAt'),
            Fields::optionalInteger($payload, 'failedRewriteCount'),
            Fields::optionalString($payload, 'forceRequestedAt'),
            Fields::optionalString($payload, 'latestFailureReason'),
            Fields::optionalString($payload, 'latestRecompactedAt'),
            Fields::optionalString($payload, 'oldestPendingRewriteAt'),
            Fields::optionalInteger($payload, 'pendingRewriteCount'),
            Fields::optionalInteger($payload, 'recompactedRewriteCount'),
            Fields::optionalString($payload, 'requestedBy'),
            Fields::optionalInteger($payload, 'rewriteCount'),
            Fields::optionalInteger($payload, 'rewritingRewriteCount'),
            Fields::optionalInteger($payload, 'rewrittenRewriteCount'),
            Fields::optionalInteger($payload, 's3PropagationLagSeconds'),
            Fields::optionalString($payload, 'slaDeadlineAt'),
            Fields::optionalString($payload, 'slaState'),
            Fields::optionalString($payload, 'source'),
            Fields::optionalString($payload, 'updatedAt'),
        );
    }
}
