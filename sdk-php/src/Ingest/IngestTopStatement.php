<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestTopStatement
{
    public function __construct(
        public string $query,
        public int $calls,
        public float $totalExecMs,
        public float $meanExecMs,
        public int $rowsReturned,
        public int $walBytes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'query'),
            Fields::integer($payload, 'calls'),
            Fields::number($payload, 'totalExecMs'),
            Fields::number($payload, 'meanExecMs'),
            Fields::integer($payload, 'rowsReturned'),
            Fields::integer($payload, 'walBytes'),
        );
    }
}
