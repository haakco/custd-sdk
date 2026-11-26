<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestWorkerState
{
    public function __construct(
        public bool $available,
        public bool $enabled,
        public int $backlog,
        public int $lagSeconds,
        public int $failed,
        public int $lastSuccessUnix,
        public int $lastFailureUnix,
        public string $lastFailureReason,
        public ?IngestRollupSchedulerState $scheduler = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $scheduler = Fields::optionalObject($payload, 'scheduler');

        return new self(
            Fields::boolean($payload, 'available'),
            Fields::boolean($payload, 'enabled'),
            Fields::integer($payload, 'backlog'),
            Fields::integer($payload, 'lagSeconds'),
            Fields::integer($payload, 'failed'),
            Fields::integer($payload, 'lastSuccessUnix'),
            Fields::integer($payload, 'lastFailureUnix'),
            Fields::string($payload, 'lastFailureReason'),
            $scheduler === null ? null : IngestRollupSchedulerState::fromPayload($scheduler),
        );
    }
}
