<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RateTier is one stepped-rate tier. */
final readonly class RateTier
{
    public function __construct(
        public float $lowerBound,
        public float $pricePerUnit,
        public ?float $upperBound = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'lowerBound'),
            Fields::number($payload, 'pricePerUnit'),
            Fields::optionalNumber($payload, 'upperBound'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = ['lowerBound' => $this->lowerBound, 'pricePerUnit' => $this->pricePerUnit];
        if ($this->upperBound !== null) {
            $payload['upperBound'] = $this->upperBound;
        }

        return $payload;
    }
}
