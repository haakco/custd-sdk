<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** AssetHierarchyEdge links a parent asset node to a child asset node. */
final readonly class AssetHierarchyEdge
{
    public function __construct(
        public string $tenantKey,
        public string $parentKey,
        public string $childKey,
        public string $mode,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'tenantKey'),
            Fields::string($payload, 'parentKey'),
            Fields::string($payload, 'childKey'),
            Fields::string($payload, 'mode'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'tenantKey' => $this->tenantKey,
            'parentKey' => $this->parentKey,
            'childKey' => $this->childKey,
            'mode' => $this->mode,
        ];
    }
}
