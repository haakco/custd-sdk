<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

final readonly class SchemaActionRegisterRequest
{
    public function __construct(
        public string $checksum,
        public string $dialect,
        public bool $enabled,
        public string $eventTypeSlug,
        public string $schemaJson,
        public string $tenantSlug,
        public string $version,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'checksum' => $this->checksum,
            'dialect' => $this->dialect,
            'enabled' => $this->enabled,
            'eventTypeSlug' => $this->eventTypeSlug,
            'schemaJson' => $this->schemaJson,
            'tenantSlug' => $this->tenantSlug,
            'version' => $this->version,
        ];

        return $body;
    }
}
