<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Change is one field-level change a preview reports.
 */
final readonly class Change
{
    public function __construct(
        public string $field,
        public string $before,
        public string $after,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, "field"),
            Fields::string($payload, "before"),
            Fields::string($payload, "after"),
        );
    }
}
