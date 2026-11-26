<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementCalibrationExerciseResponse
{
    public function __construct(
        public float $confidence,
        public string $createdAt,
        public string $exerciseUuid,
        public float $lowerBound,
        public string $projectCode,
        public string $question,
        public string $status,
        public string $updatedAt,
        public float $upperBound,
        public ?float $actualValue = null,
        public ?bool $contained = null,
        public ?string $resolvedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'confidence'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'exerciseUuid'),
            Fields::number($payload, 'lowerBound'),
            Fields::string($payload, 'projectCode'),
            Fields::string($payload, 'question'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'updatedAt'),
            Fields::number($payload, 'upperBound'),
            Fields::optionalNumber($payload, 'actualValue'),
            Fields::optionalBoolean($payload, 'contained'),
            Fields::optionalString($payload, 'resolvedAt'),
        );
    }
}
