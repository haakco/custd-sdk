<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupJobList is the tenant's cleanup jobs.
 */
final readonly class CleanupJobList
{
    /**
     * @param list<CleanupJob> $jobs
     */
    public function __construct(
        public array $jobs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(CleanupJob::fromPayload(...), Fields::objects($payload, 'jobs')),
        );
    }
}
