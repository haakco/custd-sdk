<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * IngestDiagnosticsSnapshot is the ingest data path's health: request rates, buffers, databases, segments,
 * reporting and each pipeline stage. Every diagnostics route answers the whole snapshot.
 */
final readonly class IngestDiagnosticsSnapshot
{
    /**
     * @param list<IngestPipelineStage> $pipeline
     */
    public function __construct(
        public string $status,
        public string $generatedAt,
        public IngestDiagnosticsIngestState $ingest,
        public IngestBufferState $buffers,
        public IngestDatabaseState $database,
        public IngestSegmentState $segments,
        public IngestReportingState $reporting,
        public IngestSilentDropState $silentDrops,
        public array $pipeline,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            Fields::string($payload, 'generatedAt'),
            IngestDiagnosticsIngestState::fromPayload(Fields::object($payload, 'ingest')),
            IngestBufferState::fromPayload(Fields::object($payload, 'buffers')),
            IngestDatabaseState::fromPayload(Fields::object($payload, 'database')),
            IngestSegmentState::fromPayload(Fields::object($payload, 'segments')),
            IngestReportingState::fromPayload(Fields::object($payload, 'reporting')),
            IngestSilentDropState::fromPayload(Fields::object($payload, 'silentDrops')),
            array_map(IngestPipelineStage::fromPayload(...), Fields::objects($payload, 'pipeline')),
        );
    }
}
