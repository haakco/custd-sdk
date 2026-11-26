<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

final readonly class TenantCreateRequest
{
    /**
     * @param TenantPurpose::*|null $purpose
     */
    public function __construct(
        public string $companyName,
        public string $slug,
        public ?string $purpose = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companyName' => $this->companyName,
            'slug' => $this->slug,
        ];
        if ($this->purpose !== null) {
            $body['purpose'] = $this->purpose;
        }

        return $body;
    }
}
