<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageAlertEvaluation
{
    public function __construct(
        public bool $breached,
        public string $evaluatedAt,
        public int $measuredValue,
        public ?string $firedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'breached'),
            Fields::string($payload, 'evaluatedAt'),
            Fields::integer($payload, 'measuredValue'),
            Fields::optionalString($payload, 'firedAt'),
        );
    }
}
