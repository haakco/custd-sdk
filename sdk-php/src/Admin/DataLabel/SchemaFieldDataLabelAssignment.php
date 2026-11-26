<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class SchemaFieldDataLabelAssignment
{
    public function __construct(
        public string $assignmentUuid,
        public string $definitionUuid,
        public string $fieldPath,
        public string $schemaUuid,
        public string $valueUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'assignmentUuid'),
            Fields::string($payload, 'definitionUuid'),
            Fields::string($payload, 'fieldPath'),
            Fields::string($payload, 'schemaUuid'),
            Fields::string($payload, 'valueUuid'),
        );
    }
}
