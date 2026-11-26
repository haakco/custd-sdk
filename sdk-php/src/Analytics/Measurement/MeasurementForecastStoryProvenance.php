<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryProvenance
{
    public function __construct(
        public string $generatedAt,
        public string $owner,
        public ?string $latestEngine = null,
        public ?string $latestInputHash = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'generatedAt'),
            Fields::string($payload, 'owner'),
            Fields::optionalString($payload, 'latestEngine'),
            Fields::optionalString($payload, 'latestInputHash'),
        );
    }
}
