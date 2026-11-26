<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestMonitoringAlert
{
    public function __construct(
        public string $id,
        public string $type,
        public string $title,
        public string $message,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'id'),
            Fields::string($payload, 'type'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'message'),
        );
    }
}
