<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SupportAccess;

final readonly class SupportAccessGrantCreateRequest
{
    public function __construct(
        public string $companySlug,
        public string $expiresAt,
        public string $reason,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'expiresAt' => $this->expiresAt,
            'reason' => $this->reason,
        ];

        return $body;
    }
}
