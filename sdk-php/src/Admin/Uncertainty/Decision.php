<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Decision
{
    public function __construct(
        public string $output,
        public float $threshold,
        public float $valuePerUnit,
        public ?float $minimumWorthwhile = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'output'),
            Fields::number($payload, 'threshold'),
            Fields::number($payload, 'valuePerUnit'),
            Fields::optionalNumber($payload, 'minimumWorthwhile'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'output' => $this->output,
            'threshold' => $this->threshold,
            'valuePerUnit' => $this->valuePerUnit,
        ];
        if ($this->minimumWorthwhile !== null) {
            $body['minimumWorthwhile'] = $this->minimumWorthwhile;
        }

        return $body;
    }
}
