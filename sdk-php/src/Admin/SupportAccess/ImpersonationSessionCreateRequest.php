<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SupportAccess;

final readonly class ImpersonationSessionCreateRequest
{
    public function __construct(
        public string $companySlug,
        public string $targetUserUuid,
        public string $reason,
        public string $expiresAt,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'targetUserUuid' => $this->targetUserUuid,
            'reason' => $this->reason,
            'expiresAt' => $this->expiresAt,
        ];

        return $body;
    }
}
