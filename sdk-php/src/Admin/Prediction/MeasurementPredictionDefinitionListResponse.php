<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionDefinitionListResponse
{
    /**
     * @param list<MeasurementPredictionDefinition> $items
     */
    public function __construct(
        public array $items,
        public ?string $nextPageToken = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementPredictionDefinition::fromPayload(...), Fields::objects($payload, 'items')),
            Fields::optionalString($payload, 'next_page_token'),
        );
    }
}
