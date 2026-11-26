<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

final readonly class SchemaActionDryRunRequest
{
    /**
     * @param list<mixed> $samples
     */
    public function __construct(
        public string $dialect,
        public string $eventTypeSlug,
        public array $samples,
        public string $schemaJson,
        public string $tenantSlug,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'dialect' => $this->dialect,
            'eventTypeSlug' => $this->eventTypeSlug,
            'samples' => $this->samples,
            'schemaJson' => $this->schemaJson,
            'tenantSlug' => $this->tenantSlug,
        ];

        return $body;
    }
}
