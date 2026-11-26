<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class JobResponse
{
    /**
     * @param list<string> $formats
     * @param list<ArtifactResponse> $artifacts
     * @param list<ProgressCounter> $progressCounters
     */
    public function __construct(
        public int $attemptCount,
        public int $cleanupAttempts,
        public string $cleanupState,
        public string $dashboardKey,
        public array $formats,
        public string $id,
        public int $packGeneration,
        public string $packKey,
        public string $parametersDigest,
        public string $progressStage,
        public string $queuedAt,
        public string $state,
        public array $artifacts = [],
        public ?string $cancellationReason = null,
        public ?string $expiresAt = null,
        public ?string $failureCategory = null,
        public ?string $failureMessage = null,
        public ?string $finishedAt = null,
        public ?string $nextAttemptAt = null,
        public ?string $nextCleanupAt = null,
        public array $progressCounters = [],
        public ?string $snapshotSha256 = null,
        public ?string $startedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'attemptCount'),
            Fields::integer($payload, 'cleanupAttempts'),
            Fields::string($payload, 'cleanupState'),
            Fields::string($payload, 'dashboardKey'),
            Fields::strings($payload, 'formats'),
            Fields::string($payload, 'id'),
            Fields::integer($payload, 'packGeneration'),
            Fields::string($payload, 'packKey'),
            Fields::string($payload, 'parametersDigest'),
            Fields::string($payload, 'progressStage'),
            Fields::string($payload, 'queuedAt'),
            Fields::string($payload, 'state'),
            array_map(ArtifactResponse::fromPayload(...), Fields::optionalObjects($payload, 'artifacts') ?? []),
            Fields::optionalString($payload, 'cancellationReason'),
            Fields::optionalString($payload, 'expiresAt'),
            Fields::optionalString($payload, 'failureCategory'),
            Fields::optionalString($payload, 'failureMessage'),
            Fields::optionalString($payload, 'finishedAt'),
            Fields::optionalString($payload, 'nextAttemptAt'),
            Fields::optionalString($payload, 'nextCleanupAt'),
            array_map(ProgressCounter::fromPayload(...), Fields::optionalObjects($payload, 'progressCounters') ?? []),
            Fields::optionalString($payload, 'snapshotSha256'),
            Fields::optionalString($payload, 'startedAt'),
        );
    }
}
