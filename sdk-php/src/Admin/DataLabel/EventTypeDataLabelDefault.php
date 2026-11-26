<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class EventTypeDataLabelDefault
{
    public function __construct(
        public string $definitionUuid,
        public string $eventTypeSlug,
        public string $valueUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionUuid'),
            Fields::string($payload, 'eventTypeSlug'),
            Fields::string($payload, 'valueUuid'),
        );
    }
}
