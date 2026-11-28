<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageMeter
{
    public function __construct(
        public string $slug,
        public int $version,
        public string $unit,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'slug'),
            Fields::integer($payload, 'version'),
            Fields::string($payload, 'unit'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'slug' => $this->slug,
            'version' => $this->version,
            'unit' => $this->unit,
        ];

        return $payload;
    }
}
