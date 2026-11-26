<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ExecutivePeriod is the reported period's label and, when it has them, its bounds. */
final readonly class ExecutivePeriod
{
    public function __construct(
        public string $label,
        public ?string $from = null,
        public ?string $to = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            Fields::optionalString($payload, 'from'),
            Fields::optionalString($payload, 'to'),
        );
    }
}
