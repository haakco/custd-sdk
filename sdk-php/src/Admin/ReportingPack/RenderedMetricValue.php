<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RenderedMetricValue is one rendered metric reading. */
final readonly class RenderedMetricValue
{
    public function __construct(
        public float $value,
        public string $unit,
        public int $sampleCount,
        public string $dataSufficiency,
        public bool $complete,
        public ?bool $truncated = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'value'),
            Fields::string($payload, 'unit'),
            Fields::integer($payload, 'sampleCount'),
            Fields::string($payload, 'dataSufficiency'),
            Fields::boolean($payload, 'complete'),
            Fields::optionalBoolean($payload, 'truncated'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'value' => $this->value,
            'unit' => $this->unit,
            'sampleCount' => $this->sampleCount,
            'dataSufficiency' => $this->dataSufficiency,
            'complete' => $this->complete,
        ];
        if ($this->truncated !== null) {
            $payload['truncated'] = $this->truncated;
        }

        return $payload;
    }
}
