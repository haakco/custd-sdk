<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * IngestReprocessResult reports each rejected event a reprocess tried again.
 */
final readonly class IngestReprocessResult
{
    /**
     * @param list<IngestReprocessOutcome> $outcomes
     */
    public function __construct(
        public int $processed,
        public int $succeeded,
        public int $failed,
        public array $outcomes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'processed'),
            Fields::integer($payload, 'succeeded'),
            Fields::integer($payload, 'failed'),
            array_map(IngestReprocessOutcome::fromPayload(...), Fields::objects($payload, 'outcomes')),
        );
    }
}
