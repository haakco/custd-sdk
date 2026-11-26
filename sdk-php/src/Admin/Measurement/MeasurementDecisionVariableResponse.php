<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementDecisionVariableResponse
{
    public function __construct(
        public string $distributionSlug,
        public float $measurementCost,
        public string $name,
        public string $unitSlug,
        public string $variableCode,
        public string $variableUuid,
        public ?MeasurementDecisionDistributionParameters $parameters = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $parameters = Fields::optionalObject($payload, 'parameters');

        return new self(
            Fields::string($payload, 'distributionSlug'),
            Fields::number($payload, 'measurementCost'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'unitSlug'),
            Fields::string($payload, 'variableCode'),
            Fields::string($payload, 'variableUuid'),
            $parameters === null ? null : MeasurementDecisionDistributionParameters::fromPayload($parameters),
        );
    }
}
