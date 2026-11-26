<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

final readonly class MeasurementPredictionDefinitionCreateRequest
{
    /**
     * @param PredictionProjectKind::*|null $projectKind
     */
    public function __construct(
        public string $definitionKey,
        public string $displayName,
        public ?string $description = null,
        public ?string $projectKind = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'definition_key' => $this->definitionKey,
            'display_name' => $this->displayName,
        ];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->projectKind !== null) {
            $body['project_kind'] = $this->projectKind;
        }

        return $body;
    }
}
