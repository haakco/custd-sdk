<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** FilterDefinition is one allowed filter dimension and its operators. */
final readonly class FilterDefinition
{
    /** @param list<string> $operators */
    public function __construct(
        public string $dimension,
        public array $operators,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'dimension'), Fields::strings($payload, 'operators'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['dimension' => $this->dimension, 'operators' => $this->operators];
    }
}
