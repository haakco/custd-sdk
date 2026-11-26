<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestStatusCounts
{
    public function __construct(
        public int $n2xx,
        public int $n4xx,
        public int $n5xx,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, '2xx'),
            Fields::integer($payload, '4xx'),
            Fields::integer($payload, '5xx'),
        );
    }
}
