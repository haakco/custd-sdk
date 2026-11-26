<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

/** EventSchemaRegisterRequest stores a schema version, creating the event type when it is new. */
final readonly class EventSchemaRegisterRequest
{
    public function __construct(
        public string $slug,
        public string $name,
        public string $version,
        public string $jsonSchema,
        public bool $enabled = true,
        public bool $isActive = true,
    ) {
    }

    /** @return array{slug: string, name: string, version: string, jsonSchema: string, enabled: bool, isActive: bool} */
    public function serialise(): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'version' => $this->version,
            'jsonSchema' => $this->jsonSchema,
            'enabled' => $this->enabled,
            'isActive' => $this->isActive,
        ];
    }
}
