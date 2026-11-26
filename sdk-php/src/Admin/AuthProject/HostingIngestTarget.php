<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** HostingIngestTarget names the tenant data scope and resource a hosted Site writes to. */
final readonly class HostingIngestTarget
{
    public function __construct(
        public string $scopeUuid,
        public string $resourceUuid,
    ) {
    }

    /** @return array{scopeUuid: string, resourceUuid: string} */
    public function toPayload(): array
    {
        return ['scopeUuid' => $this->scopeUuid, 'resourceUuid' => $this->resourceUuid];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'scopeUuid'), Fields::string($payload, 'resourceUuid'));
    }
}
