<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaIssue
{
    public function __construct(
        public string $code,
        public string $message,
        public string $path,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'code'),
            Fields::string($payload, 'message'),
            Fields::string($payload, 'path'),
        );
    }
}
