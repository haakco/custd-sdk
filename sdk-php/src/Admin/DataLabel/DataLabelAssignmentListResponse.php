<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelAssignmentListResponse
{
    /**
     * @param list<EventTypeDataLabelDefault> $eventTypeDefaults
     * @param list<SchemaFieldDataLabelAssignment> $schemaFieldAssignments
     */
    public function __construct(
        public array $eventTypeDefaults,
        public array $schemaFieldAssignments,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(EventTypeDataLabelDefault::fromPayload(...), Fields::objects($payload, 'eventTypeDefaults')),
            array_map(SchemaFieldDataLabelAssignment::fromPayload(...), Fields::objects($payload, 'schemaFieldAssignments')),
        );
    }
}
