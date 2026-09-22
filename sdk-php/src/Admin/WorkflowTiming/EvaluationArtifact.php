<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * EvaluationArtifact is the measurement owner's evaluation document, passed
 * through with its own schema version and content hash. Its nested evaluation body
 * is another owner's contract and is surfaced verbatim rather than re-typed here,
 * so Custd can extend it without forcing an SDK release.
 */
final readonly class EvaluationArtifact
{
    public function __construct(
        public string $schemaVersion = '',
        public string $source = '',
        public string $predictionVersionUuid = '',
        public string $contentSha256 = '',
        /** @var array<string, mixed> */
        public array $evaluation = [],
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'schema_version'),
            Payload::string($payload, 'source'),
            Payload::string($payload, 'prediction_version_uuid'),
            Payload::string($payload, 'content_sha256'),
            Payload::object($payload, 'evaluation'),
        );
    }
}
