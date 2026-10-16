<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** NumericSelector selects a numeric field with its unit. */
final readonly class NumericSelector
{
    public function __construct(
        public string $selector,
        public string $type,
        public string $unit,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'selector'),
            Fields::string($payload, 'type'),
            Fields::string($payload, 'unit'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['selector' => $this->selector, 'type' => $this->type, 'unit' => $this->unit];
    }
}
