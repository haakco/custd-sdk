<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * CreateScopeRequest creates one parent-company data scope.
 *
 * Building an invalid request throws here so it never costs a round trip.
 */
final readonly class CreateScopeRequest
{
    public function __construct(
        public string $code,
        public string $name,
    ) {
        DataScopeValidation::assertCode($this->code, 'data scope');
        DataScopeValidation::assertName($this->name, 'data scope');
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        return ['code' => $this->code, 'name' => $this->name];
    }
}
