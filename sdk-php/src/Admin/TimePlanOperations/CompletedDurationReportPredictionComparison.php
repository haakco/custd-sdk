<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportPredictionComparison
{
    /**
     * @param list<string>|null $warnings
     */
    public function __construct(
        public string $blockUuid,
        public string $inputHash,
        public string $method,
        public string $methodVersion,
        public int $pointMs,
        public string $predictedAt,
        public int $sampleCount,
        public ?int $absoluteErrorMs = null,
        public ?int $actualMs = null,
        public ?bool $intervalCovered = null,
        public ?int $p10Ms = null,
        public ?int $p90Ms = null,
        public ?array $warnings = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'block_uuid'),
            Fields::string($payload, 'input_hash'),
            Fields::string($payload, 'method'),
            Fields::string($payload, 'method_version'),
            Fields::integer($payload, 'point_ms'),
            Fields::string($payload, 'predicted_at'),
            Fields::integer($payload, 'sample_count'),
            Fields::optionalInteger($payload, 'absolute_error_ms'),
            Fields::optionalInteger($payload, 'actual_ms'),
            Fields::optionalBoolean($payload, 'interval_covered'),
            Fields::optionalInteger($payload, 'p10_ms'),
            Fields::optionalInteger($payload, 'p90_ms'),
            Fields::optionalStrings($payload, 'warnings') ?? [],
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'block_uuid' => $this->blockUuid,
            'input_hash' => $this->inputHash,
            'method' => $this->method,
            'method_version' => $this->methodVersion,
            'point_ms' => $this->pointMs,
            'predicted_at' => $this->predictedAt,
            'sample_count' => $this->sampleCount,
        ];
        if ($this->absoluteErrorMs !== null) {
            $body['absolute_error_ms'] = $this->absoluteErrorMs;
        }
        if ($this->actualMs !== null) {
            $body['actual_ms'] = $this->actualMs;
        }
        if ($this->intervalCovered !== null) {
            $body['interval_covered'] = $this->intervalCovered;
        }
        if ($this->p10Ms !== null) {
            $body['p10_ms'] = $this->p10Ms;
        }
        if ($this->p90Ms !== null) {
            $body['p90_ms'] = $this->p90Ms;
        }
        if ($this->warnings !== null) {
            $body['warnings'] = $this->warnings;
        }

        return $body;
    }
}
