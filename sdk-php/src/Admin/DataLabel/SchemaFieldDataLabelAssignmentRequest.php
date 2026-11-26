<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

final readonly class SchemaFieldDataLabelAssignmentRequest
{
    public function __construct(
        public string $definitionUuid,
        public string $fieldPath,
        public string $valueUuid,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'definitionUuid' => $this->definitionUuid,
            'fieldPath' => $this->fieldPath,
            'valueUuid' => $this->valueUuid,
        ];

        return $body;
    }
}
