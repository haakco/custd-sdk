<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

/** EventSchemaCheckRequest is a schema, and optional example events, checked without registering anything. */
final readonly class EventSchemaCheckRequest
{
    /** @param list<array<string, mixed>> $examples Example events, each a JSON object. */
    public function __construct(
        public string $slug,
        public string $version,
        public string $jsonSchema,
        public string $name = '',
        public array $examples = [],
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = ['slug' => $this->slug, 'version' => $this->version, 'jsonSchema' => $this->jsonSchema];
        if ($this->name !== '') {
            $body['name'] = $this->name;
        }
        if ($this->examples !== []) {
            $body['examples'] = $this->examples;
        }

        return $body;
    }
}
