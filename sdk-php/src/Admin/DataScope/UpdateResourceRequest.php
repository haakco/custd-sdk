<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * UpdateResourceRequest changes the editable fields of a resource. Both fields
 * are optional, but at least one must be present.
 */
final readonly class UpdateResourceRequest
{
    public function __construct(
        public ?string $name = null,
        public ?string $status = null,
    ) {
        if ($this->name === null && $this->status === null) {
            throw new \InvalidArgumentException('custd: data scope resource update requires a name or a status');
        }
        if ($this->name !== null) {
            DataScopeValidation::assertName($this->name, 'data scope resource');
        }
        if ($this->status !== null) {
            DataScopeValidation::assertStatus($this->status, 'data scope resource');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        $payload = [];
        if ($this->name !== null) {
            $payload['name'] = $this->name;
        }
        if ($this->status !== null) {
            $payload['status'] = $this->status;
        }

        return $payload;
    }
}
