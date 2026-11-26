<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

final readonly class OAuthClientAdmissionRevokeRequest
{
    public function __construct(
        public string $companySlug,
        public int $expectedRevision,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'expectedRevision' => $this->expectedRevision,
        ];

        return $body;
    }
}
