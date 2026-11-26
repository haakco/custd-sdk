<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelDefinitionListResponse
{
    /**
     * @param list<DataLabelDefinition> $definitions
     */
    public function __construct(
        public array $definitions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DataLabelDefinition::fromPayload(...), Fields::objects($payload, 'definitions')),
        );
    }
}
