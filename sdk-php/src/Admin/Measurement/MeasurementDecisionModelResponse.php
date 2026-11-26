<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementDecisionModelResponse
{
    /**
     * @param list<MeasurementDecisionChoiceResponse> $choices
     * @param list<MeasurementDecisionVariableResponse> $variables
     */
    public function __construct(
        public string $createdAt,
        public string $decisionCode,
        public string $decisionUuid,
        public string $description,
        public string $name,
        public string $objective,
        public string $projectCode,
        public string $status,
        public string $updatedAt,
        public array $choices = [],
        public array $variables = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'decisionCode'),
            Fields::string($payload, 'decisionUuid'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'objective'),
            Fields::string($payload, 'projectCode'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'updatedAt'),
            array_map(MeasurementDecisionChoiceResponse::fromPayload(...), Fields::optionalObjects($payload, 'choices') ?? []),
            array_map(MeasurementDecisionVariableResponse::fromPayload(...), Fields::optionalObjects($payload, 'variables') ?? []),
        );
    }
}
