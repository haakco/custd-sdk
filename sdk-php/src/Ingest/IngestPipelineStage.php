<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestPipelineStage
{
    public function __construct(
        public string $name,
        public string $status,
        public string $headline,
        public string $detailKey,
        public ?IngestStageProgress $progress = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $progress = Fields::optionalObject($payload, 'progress');

        return new self(
            Fields::string($payload, 'name'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'headline'),
            Fields::string($payload, 'detailKey'),
            $progress === null ? null : IngestStageProgress::fromPayload($progress),
        );
    }
}
