<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

final readonly class MeasurementPredictionDefinitionUpdateRequest
{
    public function __construct(
        public string $definitionKey,
        public int $revision,
        public ?string $description = null,
        public ?string $displayName = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'definition_key' => $this->definitionKey,
            'revision' => $this->revision,
        ];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->displayName !== null) {
            $body['display_name'] = $this->displayName;
        }

        return $body;
    }
}
