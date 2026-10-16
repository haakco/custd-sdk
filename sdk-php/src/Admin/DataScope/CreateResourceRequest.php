<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * CreateResourceRequest creates one resource inside a data scope. The owning
 * scope is taken from the route, never the body.
 */
final readonly class CreateResourceRequest
{
    public function __construct(
        public string $code,
        public string $name,
    ) {
        DataScopeValidation::assertCode($this->code, 'data scope resource');
        DataScopeValidation::assertName($this->name, 'data scope resource');
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        return ['code' => $this->code, 'name' => $this->name];
    }
}
