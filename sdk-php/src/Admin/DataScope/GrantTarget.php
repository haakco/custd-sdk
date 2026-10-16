<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * GrantTarget names what a grant covers. Configuration surfaces address the
 * target by UUID; the immutable codes are for event/query selection.
 */
final readonly class GrantTarget
{
    /** The closed grant-target discriminators. */
    public const KINDS = ['parent', 'sub_client', 'resource'];

    public function __construct(
        public string $kind,
        public ?string $scopeUuid = null,
        public ?string $resourceUuid = null,
    ) {
        switch ($this->kind) {
            case 'parent':
                if ($this->scopeUuid !== null || $this->resourceUuid !== null) {
                    throw new \InvalidArgumentException('custd: a parent target carries no scope or resource');
                }

                return;
            case 'sub_client':
                if ($this->scopeUuid === null || !DataScopeValidation::isUuid($this->scopeUuid) || $this->resourceUuid !== null) {
                    throw new \InvalidArgumentException('custd: a sub_client target requires scopeUuid and no resourceUuid');
                }

                return;
            case 'resource':
                if (
                    $this->scopeUuid === null || !DataScopeValidation::isUuid($this->scopeUuid)
                    || $this->resourceUuid === null || !DataScopeValidation::isUuid($this->resourceUuid)
                ) {
                    throw new \InvalidArgumentException('custd: a resource target requires scopeUuid and resourceUuid');
                }

                return;
            default:
                throw new \InvalidArgumentException(
                    'custd: data scope grant target kind must be "parent", "sub_client" or "resource"'
                );
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        $payload = ['kind' => $this->kind];
        if ($this->scopeUuid !== null) {
            $payload['scopeUuid'] = $this->scopeUuid;
        }
        if ($this->resourceUuid !== null) {
            $payload['resourceUuid'] = $this->resourceUuid;
        }

        return $payload;
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'kind'),
            Fields::optionalString($payload, 'scopeUuid'),
            Fields::optionalString($payload, 'resourceUuid'),
        );
    }
}
