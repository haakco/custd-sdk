<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

final readonly class MeasurementPredictionVersionPublishRequest
{
    public function __construct(
        public string $createdBy,
        public mixed $definition = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'created_by' => $this->createdBy,
        ];
        if ($this->definition !== null) {
            $body['definition'] = $this->definition;
        }

        return $body;
    }
}
