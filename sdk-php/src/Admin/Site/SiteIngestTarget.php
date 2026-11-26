<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Site;

use HaakCo\Custd\Fields;

final readonly class SiteIngestTarget
{
    public function __construct(
        public string $resourceUuid,
        public string $scopeUuid,
        public ?string $resourceCode = null,
        public ?string $scopeCode = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'resourceUuid'),
            Fields::string($payload, 'scopeUuid'),
            Fields::optionalString($payload, 'resourceCode'),
            Fields::optionalString($payload, 'scopeCode'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'resourceUuid' => $this->resourceUuid,
            'scopeUuid' => $this->scopeUuid,
        ];
        if ($this->resourceCode !== null) {
            $body['resourceCode'] = $this->resourceCode;
        }
        if ($this->scopeCode !== null) {
            $body['scopeCode'] = $this->scopeCode;
        }

        return $body;
    }
}
