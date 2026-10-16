<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ObservationAsset is one named observation asset. */
final readonly class ObservationAsset
{
    public function __construct(
        public string $key,
        public string $label,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'key'), Fields::string($payload, 'label'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['key' => $this->key, 'label' => $this->label];
    }
}
