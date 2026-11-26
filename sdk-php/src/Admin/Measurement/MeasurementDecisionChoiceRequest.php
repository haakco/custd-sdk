<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementDecisionChoiceRequest
{
    public function __construct(
        public string $choiceCode,
        public MeasurementDecisionExpression $expression,
        public string $name,
        public ?string $description = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'choiceCode' => $this->choiceCode,
            'expression' => $this->expression->serialise(),
            'name' => $this->name,
        ];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }

        return $body;
    }
}
