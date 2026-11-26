<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelUsage
{
    public function __construct(
        public string $definitionUuid,
        public int $eventTypeDefaults,
        public int $schemaFieldAssignments,
        public int $total,
        public string $valueUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionUuid'),
            Fields::integer($payload, 'eventTypeDefaults'),
            Fields::integer($payload, 'schemaFieldAssignments'),
            Fields::integer($payload, 'total'),
            Fields::string($payload, 'valueUuid'),
        );
    }
}
