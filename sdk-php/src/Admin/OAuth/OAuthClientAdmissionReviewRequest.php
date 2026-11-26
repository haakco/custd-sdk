<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

final readonly class OAuthClientAdmissionReviewRequest
{
    public function __construct(
        public string $companySlug,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
        ];

        return $body;
    }
}
