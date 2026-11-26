<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementDecisionModelCreateRequest
{
    /**
     * @param list<MeasurementDecisionChoiceRequest> $choices
     * @param list<MeasurementDecisionVariableRequest> $variables
     */
    public function __construct(
        public array $choices,
        public string $decisionCode,
        public string $name,
        public string $status,
        public array $variables,
        public ?string $description = null,
        public ?string $objective = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'choices' => array_map(static fn (MeasurementDecisionChoiceRequest $item): array => $item->serialise(), $this->choices),
            'decisionCode' => $this->decisionCode,
            'name' => $this->name,
            'status' => $this->status,
            'variables' => array_map(static fn (MeasurementDecisionVariableRequest $item): array => $item->serialise(), $this->variables),
        ];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->objective !== null) {
            $body['objective'] = $this->objective;
        }

        return $body;
    }
}
