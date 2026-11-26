<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementCalibrationExerciseCreateRequest
{
    public function __construct(
        public float $confidence,
        public float $lowerBound,
        public string $question,
        public float $upperBound,
        public ?float $actualValue = null,
        public ?bool $contained = null,
        public mixed $metadata = null,
        public ?string $priorUuid = null,
        public ?string $resolvedAt = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'confidence' => $this->confidence,
            'lowerBound' => $this->lowerBound,
            'question' => $this->question,
            'upperBound' => $this->upperBound,
        ];
        if ($this->actualValue !== null) {
            $body['actualValue'] = $this->actualValue;
        }
        if ($this->contained !== null) {
            $body['contained'] = $this->contained;
        }
        if ($this->metadata !== null) {
            $body['metadata'] = $this->metadata;
        }
        if ($this->priorUuid !== null) {
            $body['priorUuid'] = $this->priorUuid;
        }
        if ($this->resolvedAt !== null) {
            $body['resolvedAt'] = $this->resolvedAt;
        }

        return $body;
    }
}
