<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

final readonly class SchemaActionEnableRequest
{
    public function __construct(
        public string $enabledAt,
        public string $eventTypeSlug,
        public string $tenantSlug,
        public string $version,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'enabledAt' => $this->enabledAt,
            'eventTypeSlug' => $this->eventTypeSlug,
            'tenantSlug' => $this->tenantSlug,
            'version' => $this->version,
        ];

        return $body;
    }
}
