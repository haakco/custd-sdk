<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * LogObservabilityBindings is the typed log-observability binding a client
 * selects. It names its registered log event type and payload fields; the
 * backend owns the metric, dimension, template and widget keys and the
 * validation. It is never an untyped dictionary.
 */
final readonly class LogObservabilityBindings
{
    public function __construct(
        public string $eventType,
        public string $severityField,
        public string $resourceField,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'eventType' => $this->eventType,
            'severityField' => $this->severityField,
            'resourceField' => $this->resourceField,
        ];
    }
}
