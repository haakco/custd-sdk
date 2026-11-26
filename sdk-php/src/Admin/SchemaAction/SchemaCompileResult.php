<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaCompileResult
{
    /**
     * @param list<string> $issues
     */
    public function __construct(
        public array $issues,
        public bool $valid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::strings($payload, 'issues'),
            Fields::boolean($payload, 'valid'),
        );
    }
}
