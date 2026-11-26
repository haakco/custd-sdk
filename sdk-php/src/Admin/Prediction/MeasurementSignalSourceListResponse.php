<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementSignalSourceListResponse
{
    /**
     * @param list<MeasurementSignalSource> $sources
     */
    public function __construct(
        public array $sources,
        public ?string $nextPageToken = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementSignalSource::fromPayload(...), Fields::objects($payload, 'sources')),
            Fields::optionalString($payload, 'next_page_token'),
        );
    }
}
