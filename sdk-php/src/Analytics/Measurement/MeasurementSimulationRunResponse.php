<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementSimulationRunResponse
{
    /**
     * @param array<string, string> $provenance
     * @param list<MeasurementVOIVariableResponse> $variables
     * @param list<MeasurementSimulationWarning> $warnings
     */
    public function __construct(
        public string $completedAt,
        public string $decisionUuid,
        public string $generatedAt,
        public string $method,
        public string $projectUuid,
        public array $provenance,
        public int $sampleCount,
        public int $seed,
        public string $simulationRunUuid,
        public string $status,
        public array $variables,
        public array $warnings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'completedAt'),
            Fields::string($payload, 'decisionUuid'),
            Fields::string($payload, 'generatedAt'),
            Fields::string($payload, 'method'),
            Fields::string($payload, 'projectUuid'),
            Fields::stringMap($payload, 'provenance'),
            Fields::integer($payload, 'sampleCount'),
            Fields::integer($payload, 'seed'),
            Fields::string($payload, 'simulationRunUuid'),
            Fields::string($payload, 'status'),
            array_map(MeasurementVOIVariableResponse::fromPayload(...), Fields::objects($payload, 'variables')),
            array_map(MeasurementSimulationWarning::fromPayload(...), Fields::optionalObjects($payload, 'warnings') ?? []),
        );
    }
}
