<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementDecisionDistributionParameters
{
    public function __construct(
        public ?float $max = null,
        public ?float $mean = null,
        public ?float $min = null,
        public ?float $mode = null,
        public ?float $stdDev = null,
        public ?float $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalNumber($payload, 'max'),
            Fields::optionalNumber($payload, 'mean'),
            Fields::optionalNumber($payload, 'min'),
            Fields::optionalNumber($payload, 'mode'),
            Fields::optionalNumber($payload, 'std-dev'),
            Fields::optionalNumber($payload, 'value'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->max !== null) {
            $body['max'] = $this->max;
        }
        if ($this->mean !== null) {
            $body['mean'] = $this->mean;
        }
        if ($this->min !== null) {
            $body['min'] = $this->min;
        }
        if ($this->mode !== null) {
            $body['mode'] = $this->mode;
        }
        if ($this->stdDev !== null) {
            $body['std-dev'] = $this->stdDev;
        }
        if ($this->value !== null) {
            $body['value'] = $this->value;
        }

        return $body;
    }
}
