<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** AssetNode is one node in an asset hierarchy. */
final readonly class AssetNode
{
    public function __construct(
        public string $tenantKey,
        public string $key,
        public string $label,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'tenantKey'),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['tenantKey' => $this->tenantKey, 'key' => $this->key, 'label' => $this->label];
    }
}
