<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * IngestCleanupResult counts the expired raw, event and rejected rows a cleanup deleted.
 */
final readonly class IngestCleanupResult
{
    public function __construct(
        public int $deletedRaw,
        public int $deletedEvents,
        public int $deletedRejected,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'deletedRaw'),
            Fields::integer($payload, 'deletedEvents'),
            Fields::integer($payload, 'deletedRejected'),
        );
    }
}
