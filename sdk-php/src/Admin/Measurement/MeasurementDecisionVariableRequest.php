<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementDecisionVariableRequest
{
    public function __construct(
        public string $distributionSlug,
        public string $name,
        public string $variableCode,
        public ?float $measurementCost = null,
        public ?MeasurementDecisionDistributionParameters $parameters = null,
        public ?string $unitSlug = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'distributionSlug' => $this->distributionSlug,
            'name' => $this->name,
            'variableCode' => $this->variableCode,
        ];
        if ($this->measurementCost !== null) {
            $body['measurementCost'] = $this->measurementCost;
        }
        if ($this->parameters !== null) {
            $body['parameters'] = $this->parameters->serialise();
        }
        if ($this->unitSlug !== null) {
            $body['unitSlug'] = $this->unitSlug;
        }

        return $body;
    }
}
