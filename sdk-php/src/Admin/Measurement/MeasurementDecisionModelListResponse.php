<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementDecisionModelListResponse
{
    /**
     * @param list<MeasurementDecisionModelResponse> $decisions
     */
    public function __construct(
        public array $decisions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementDecisionModelResponse::fromPayload(...), Fields::objects($payload, 'decisions')),
        );
    }
}
