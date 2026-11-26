<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Input
{
    /**
     * @param list<float>|null $samples
     * @param ModelRangeDistribution::*|null $distribution
     * @param ModelInputShape::* $shape
     */
    public function __construct(
        public string $shape,
        public ?string $distribution = null,
        public ?float $high = null,
        public ?float $low = null,
        public ?array $samples = null,
        public ?InputSource $source = null,
        public ?int $successes = null,
        public ?int $trials = null,
        public ?float $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $source = Fields::optionalObject($payload, 'source');

        return new self(
            Fields::string($payload, 'shape'),
            Fields::optionalString($payload, 'distribution'),
            Fields::optionalNumber($payload, 'high'),
            Fields::optionalNumber($payload, 'low'),
            property_exists($payload, 'samples') ? Fields::numbers($payload, 'samples') : [],
            $source === null ? null : InputSource::fromPayload($source),
            Fields::optionalInteger($payload, 'successes'),
            Fields::optionalInteger($payload, 'trials'),
            Fields::optionalNumber($payload, 'value'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'shape' => $this->shape,
        ];
        if ($this->distribution !== null) {
            $body['distribution'] = $this->distribution;
        }
        if ($this->high !== null) {
            $body['high'] = $this->high;
        }
        if ($this->low !== null) {
            $body['low'] = $this->low;
        }
        if ($this->samples !== null) {
            $body['samples'] = $this->samples;
        }
        if ($this->source !== null) {
            $body['source'] = $this->source->serialise();
        }
        if ($this->successes !== null) {
            $body['successes'] = $this->successes;
        }
        if ($this->trials !== null) {
            $body['trials'] = $this->trials;
        }
        if ($this->value !== null) {
            $body['value'] = $this->value;
        }

        return $body;
    }
}
