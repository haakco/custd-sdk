<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class SnapshotLabelMetadata
{
    /**
     * @param list<SnapshotLabelValue> $values
     */
    public function __construct(
        public string $definitionUuid,
        public string $displayName,
        public string $key,
        public string $sensitivity,
        public array $values,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionUuid'),
            Fields::string($payload, 'displayName'),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'sensitivity'),
            array_map(SnapshotLabelValue::fromPayload(...), Fields::objects($payload, 'values')),
        );
    }
}
