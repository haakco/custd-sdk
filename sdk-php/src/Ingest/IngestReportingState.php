<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestReportingState
{
    public function __construct(
        public bool $available,
        public string $freshSource,
        public string $archiveSource,
        public int $missingWindows,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'available'),
            Fields::string($payload, 'freshSource'),
            Fields::string($payload, 'archiveSource'),
            Fields::integer($payload, 'missingWindows'),
        );
    }
}
