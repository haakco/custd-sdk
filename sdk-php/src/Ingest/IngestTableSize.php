<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestTableSize
{
    public function __construct(
        public string $tableName,
        public int $rowEstimate,
        public int $totalBytes,
        public int $tableBytes,
        public int $indexBytes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'tableName'),
            Fields::integer($payload, 'rowEstimate'),
            Fields::integer($payload, 'totalBytes'),
            Fields::integer($payload, 'tableBytes'),
            Fields::integer($payload, 'indexBytes'),
        );
    }
}
