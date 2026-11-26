<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventSchemaInferResult is a candidate schema inferred from sample events. */
final readonly class EventSchemaInferResult
{
    /**
     * @param list<EventSchemaIssue> $issues
     * @param list<EventSchemaIssue> $inferenceWarnings
     */
    public function __construct(
        public bool $valid,
        public array $issues,
        public array $inferenceWarnings,
        public string $candidateSchema,
        public string $validatorEngine,
        public string $validatorVersion,
        public string $schemaChecksum,
        public string $schemaDialect,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $payload = Fields::jsonObject($payload, 'schema inference response');

        return new self(
            Fields::boolean($payload, 'valid'),
            EventSchemaIssue::listFrom($payload, 'issues'),
            EventSchemaIssue::listFrom($payload, 'inferenceWarnings'),
            Fields::string($payload, 'candidateSchema'),
            Fields::string($payload, 'validatorEngine'),
            Fields::string($payload, 'validatorVersion'),
            Fields::string($payload, 'schemaChecksum'),
            Fields::string($payload, 'schemaDialect'),
        );
    }
}
