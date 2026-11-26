<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class SnapshotDatasetSchema
{
    /**
     * @param list<SnapshotColumn> $columns
     */
    public function __construct(
        public array $columns,
        public string $key,
        public string $label,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SnapshotColumn::fromPayload(...), Fields::objects($payload, 'columns')),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
        );
    }
}
