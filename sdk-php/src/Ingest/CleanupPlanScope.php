<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupPlanScope is the frozen scope a plan was computed for.
 */
final readonly class CleanupPlanScope
{
    /**
     * @param list<string> $approvedS3Prefixes
     * @param list<CleanupJetStreamSelection> $jetStream
     */
    public function __construct(
        public string $mode,
        public array $approvedS3Prefixes,
        public ?string $reason = null,
        public ?string $tenantSlug = null,
        public ?string $eventTypeSlug = null,
        public ?string $startedAt = null,
        public ?string $endedAt = null,
        public array $jetStream = [],
        public ?string $jetStreamExecution = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'mode'),
            Fields::strings($payload, 'approvedS3Prefixes'),
            Fields::optionalString($payload, 'reason'),
            Fields::optionalString($payload, 'tenantSlug'),
            Fields::optionalString($payload, 'eventTypeSlug'),
            Fields::optionalString($payload, 'startedAt'),
            Fields::optionalString($payload, 'endedAt'),
            array_map(CleanupJetStreamSelection::fromPayload(...), Fields::optionalObjects($payload, 'jetStream') ?? []),
            Fields::optionalString($payload, 'jetStreamExecution'),
        );
    }
}
