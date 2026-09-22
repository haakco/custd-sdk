<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * Expectation is one evidence-backed duration expectation. The point and range
 * are null when the engine did not produce them, which is what keeps a cold start
 * from looking like a supported forecast.
 */
final readonly class Expectation
{
    /** @param list<string> $warnings */
    public function __construct(
        public string $seriesKey = '',
        public string $state = 'unavailable',
        public int $baselineMs = 0,
        public ?int $expectedMs = null,
        public ?int $conservativeLowMs = null,
        public ?int $conservativeHighMs = null,
        public int $sampleCount = 0,
        public string $method = '',
        public string $methodVersion = '',
        public string $predictionVersionUuid = '',
        public string $inputHash = '',
        public string $generatedAt = '',
        public string $evidenceWindowStart = '',
        public string $stepKey = '',
        public int $attempt = 0,
        public array $warnings = [],
    ) {
    }

    /** isSupported reports whether the expectation is backed by enough comparable history. */
    public function isSupported(): bool
    {
        return $this->state === 'ready';
    }

    /**
     * hasRange reports whether the engine produced an interval. A caller must not
     * render a range it invented.
     */
    public function hasRange(): bool
    {
        return $this->conservativeLowMs !== null && $this->conservativeHighMs !== null;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'seriesKey'),
            Payload::optionalString($payload, 'state') ?? 'unavailable',
            Payload::integer($payload, 'baselineMs'),
            Payload::optionalInteger($payload, 'expectedMs'),
            Payload::optionalInteger($payload, 'conservativeLowMs'),
            Payload::optionalInteger($payload, 'conservativeHighMs'),
            Payload::integer($payload, 'sampleCount'),
            Payload::string($payload, 'method'),
            Payload::string($payload, 'methodVersion'),
            Payload::optionalString($payload, 'predictionVersionUuid') ?? '',
            Payload::string($payload, 'inputHash'),
            Payload::string($payload, 'generatedAt'),
            Payload::string($payload, 'evidenceWindowStart'),
            Payload::optionalString($payload, 'stepKey') ?? '',
            Payload::optionalInteger($payload, 'attempt') ?? 0,
            array_values(array_filter($payload['warnings'] ?? [], 'is_string')),
        );
    }
}
