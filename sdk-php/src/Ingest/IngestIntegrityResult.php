<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * IngestIntegrityResult is how many stored events were checked against their raw objects, and the orphans found.
 */
final readonly class IngestIntegrityResult
{
    /**
     * @param list<string> $orphanedUUIDs
     */
    public function __construct(
        public int $checkedCount,
        public array $orphanedUUIDs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'checkedCount'),
            Fields::strings($payload, 'orphanedUUIDs'),
        );
    }
}
