<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventSchemaIssue is one problem the validator found. */
final readonly class EventSchemaIssue
{
    public function __construct(
        public string $path,
        public string $keyword,
        public string $message,
        public string $schemaLocation,
        public string $instanceLocation,
        public string $severity,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'path'),
            Fields::string($payload, 'keyword'),
            Fields::string($payload, 'message'),
            Fields::string($payload, 'schemaLocation'),
            Fields::string($payload, 'instanceLocation'),
            Fields::string($payload, 'severity'),
        );
    }

    /** @return list<self> */
    public static function listFrom(\stdClass $payload, string $key): array
    {
        return array_map(self::fromPayload(...), Wire::objects($payload, $key));
    }
}
