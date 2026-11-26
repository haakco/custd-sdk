<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventSchemaCheckResult is the outcome of validating or dry-running a schema. */
final readonly class EventSchemaCheckResult
{
    /**
     * @param list<EventSchemaIssue> $issues
     * @param list<EventSchemaIssue> $warnings
     * @param list<EventSchemaExampleResult> $exampleResults
     * @param list<EventSchemaConflict> $conflicts
     */
    public function __construct(
        public bool $valid,
        public bool $schemaValid,
        public array $issues,
        public array $warnings,
        public array $exampleResults,
        public string $normalizedSchema,
        public string $dialect,
        public string $checksum,
        public bool $wouldCreateEventType,
        public bool $wouldCreateVersion,
        public array $conflicts,
        public string $validatorEngine,
        public string $validatorVersion,
        public string $schemaChecksum,
        public string $schemaDialect,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $payload = Fields::jsonObject($payload, 'schema check response');

        return new self(
            Fields::boolean($payload, 'valid'),
            Fields::boolean($payload, 'schemaValid'),
            EventSchemaIssue::listFrom($payload, 'issues'),
            EventSchemaIssue::listFrom($payload, 'warnings'),
            array_map(EventSchemaExampleResult::fromPayload(...), Wire::objects($payload, 'exampleResults')),
            Fields::string($payload, 'normalizedSchema'),
            Fields::string($payload, 'dialect'),
            Fields::string($payload, 'checksum'),
            Fields::boolean($payload, 'wouldCreateEventType'),
            Fields::boolean($payload, 'wouldCreateVersion'),
            array_map(EventSchemaConflict::fromPayload(...), Wire::objects($payload, 'conflicts')),
            Fields::string($payload, 'validatorEngine'),
            Fields::string($payload, 'validatorVersion'),
            Fields::string($payload, 'schemaChecksum'),
            Fields::string($payload, 'schemaDialect'),
        );
    }
}
