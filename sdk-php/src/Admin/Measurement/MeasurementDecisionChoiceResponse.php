<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementDecisionChoiceResponse
{
    public function __construct(
        public string $choiceCode,
        public string $choiceUuid,
        public string $description,
        public string $name,
        public ?MeasurementDecisionExpression $expression = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $expression = Fields::optionalObject($payload, 'expression');

        return new self(
            Fields::string($payload, 'choiceCode'),
            Fields::string($payload, 'choiceUuid'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'name'),
            $expression === null ? null : MeasurementDecisionExpression::fromPayload($expression),
        );
    }
}
