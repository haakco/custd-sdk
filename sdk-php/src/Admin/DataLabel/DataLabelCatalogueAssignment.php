<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelCatalogueAssignment
{
    public function __construct(
        public string $definitionUuid,
        public string $scope,
        public string $valueUuid,
        public ?string $eventTypeSlug = null,
        public ?string $fieldPath = null,
        public ?string $schemaUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionUuid'),
            Fields::string($payload, 'scope'),
            Fields::string($payload, 'valueUuid'),
            Fields::optionalString($payload, 'eventTypeSlug'),
            Fields::optionalString($payload, 'fieldPath'),
            Fields::optionalString($payload, 'schemaUuid'),
        );
    }
}
