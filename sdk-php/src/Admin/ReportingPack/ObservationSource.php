<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ObservationSource is one named observation source. */
final readonly class ObservationSource
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
