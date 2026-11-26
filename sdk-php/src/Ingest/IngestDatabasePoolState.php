<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestDatabasePoolState
{
    /**
     * @param list<IngestTopStatement> $writeStatements
     * @param list<IngestTopStatement> $topStatements
     * @param list<IngestWaitEvent> $waitEvents
     * @param list<IngestTableSize> $tableSizes
     */
    public function __construct(
        public bool $available,
        public int $active,
        public int $waiting,
        public int $walBytes,
        public array $writeStatements,
        public array $topStatements = [],
        public array $waitEvents = [],
        public array $tableSizes = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'available'),
            Fields::integer($payload, 'active'),
            Fields::integer($payload, 'waiting'),
            Fields::integer($payload, 'walBytes'),
            array_map(IngestTopStatement::fromPayload(...), Fields::objects($payload, 'writeStatements')),
            array_map(IngestTopStatement::fromPayload(...), Fields::optionalObjects($payload, 'topStatements') ?? []),
            array_map(IngestWaitEvent::fromPayload(...), Fields::optionalObjects($payload, 'waitEvents') ?? []),
            array_map(IngestTableSize::fromPayload(...), Fields::optionalObjects($payload, 'tableSizes') ?? []),
        );
    }
}
