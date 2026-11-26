<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

final readonly class MeasurementSignalSourceCreateRequest
{
    public function __construct(
        public string $displayName,
        public string $sourceKey,
        public string $sourceMode,
        public mixed $configuration = null,
        public ?string $description = null,
        public ?int $pollIntervalSeconds = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'display_name' => $this->displayName,
            'source_key' => $this->sourceKey,
            'source_mode' => $this->sourceMode,
        ];
        if ($this->configuration !== null) {
            $body['configuration'] = $this->configuration;
        }
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->pollIntervalSeconds !== null) {
            $body['poll_interval_seconds'] = $this->pollIntervalSeconds;
        }

        return $body;
    }
}
