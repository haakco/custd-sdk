<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastDefinition
{
    /**
     * @param DurationForecastMethod::* $method
     */
    public function __construct(
        public string $method,
        public string $methodVersion,
        public int $minimumHistory,
        public int $priorWeight,
        public string $schemaVersion,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'method'),
            Fields::string($payload, 'method_version'),
            Fields::integer($payload, 'minimum_history'),
            Fields::integer($payload, 'prior_weight'),
            Fields::string($payload, 'schema_version'),
        );
    }
}
