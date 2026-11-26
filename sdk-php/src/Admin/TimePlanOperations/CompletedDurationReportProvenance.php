<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportProvenance
{
    public function __construct(
        public int $adjustmentCount,
        public int $annotationCount,
        public bool $corrected,
        public string $generatedAt,
        public string $inputHash,
        public int $predictionCount,
        public string $reportVersion,
        public ?string $forecastEvaluationHash = null,
        public ?string $measurementInputHash = null,
        public ?string $measurementProjectionVersion = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'adjustment_count'),
            Fields::integer($payload, 'annotation_count'),
            Fields::boolean($payload, 'corrected'),
            Fields::string($payload, 'generated_at'),
            Fields::string($payload, 'input_hash'),
            Fields::integer($payload, 'prediction_count'),
            Fields::string($payload, 'report_version'),
            Fields::optionalString($payload, 'forecast_evaluation_hash'),
            Fields::optionalString($payload, 'measurement_input_hash'),
            Fields::optionalString($payload, 'measurement_projection_version'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'adjustment_count' => $this->adjustmentCount,
            'annotation_count' => $this->annotationCount,
            'corrected' => $this->corrected,
            'generated_at' => $this->generatedAt,
            'input_hash' => $this->inputHash,
            'prediction_count' => $this->predictionCount,
            'report_version' => $this->reportVersion,
        ];
        if ($this->forecastEvaluationHash !== null) {
            $body['forecast_evaluation_hash'] = $this->forecastEvaluationHash;
        }
        if ($this->measurementInputHash !== null) {
            $body['measurement_input_hash'] = $this->measurementInputHash;
        }
        if ($this->measurementProjectionVersion !== null) {
            $body['measurement_projection_version'] = $this->measurementProjectionVersion;
        }

        return $body;
    }
}
