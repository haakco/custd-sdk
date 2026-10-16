<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackSetupBindingField describes one client-selectable binding. */
final readonly class ReportingPackSetupBindingField
{
    public function __construct(
        public string $key,
        public string $label,
        public bool $required,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
            Fields::boolean($payload, 'required'),
        );
    }
}
