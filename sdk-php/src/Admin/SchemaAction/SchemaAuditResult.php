<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaAuditResult
{
    /**
     * @param list<string> $issueCodes
     */
    public function __construct(
        public string $class,
        public string $dialect,
        public string $eventTypeSlug,
        public SchemaExampleValidationSummary $exampleValidation,
        public array $issueCodes,
        public SchemaCompileResult $legacyCompile,
        public string $recommendedAction,
        public string $schemaChecksum,
        public SchemaCompileResult $sharedCompile,
        public string $tenantSlug,
        public string $version,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'class'),
            Fields::string($payload, 'dialect'),
            Fields::string($payload, 'eventTypeSlug'),
            SchemaExampleValidationSummary::fromPayload(Fields::object($payload, 'exampleValidation')),
            Fields::strings($payload, 'issueCodes'),
            SchemaCompileResult::fromPayload(Fields::object($payload, 'legacyCompile')),
            Fields::string($payload, 'recommendedAction'),
            Fields::string($payload, 'schemaChecksum'),
            SchemaCompileResult::fromPayload(Fields::object($payload, 'sharedCompile')),
            Fields::string($payload, 'tenantSlug'),
            Fields::string($payload, 'version'),
        );
    }
}
