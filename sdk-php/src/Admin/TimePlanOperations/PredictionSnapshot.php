<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class PredictionSnapshot
{
    /**
     * @param list<string> $warnings
     */
    public function __construct(
        public int $blockId,
        public string $blockUuid,
        public string $inputHash,
        public string $method,
        public string $methodVersion,
        public int $pointMs,
        public string $predictedAt,
        public string $runUuid,
        public int $sampleCount,
        public string $snapshotUuid,
        public array $warnings,
        public ?int $p10Ms = null,
        public ?int $p90Ms = null,
        public ?string $predictionVersionUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'blockId'),
            Fields::string($payload, 'blockUuid'),
            Fields::string($payload, 'inputHash'),
            Fields::string($payload, 'method'),
            Fields::string($payload, 'methodVersion'),
            Fields::integer($payload, 'pointMs'),
            Fields::string($payload, 'predictedAt'),
            Fields::string($payload, 'runUuid'),
            Fields::integer($payload, 'sampleCount'),
            Fields::string($payload, 'snapshotUuid'),
            Fields::strings($payload, 'warnings'),
            Fields::optionalInteger($payload, 'p10Ms'),
            Fields::optionalInteger($payload, 'p90Ms'),
            Fields::optionalString($payload, 'predictionVersionUuid'),
        );
    }
}
