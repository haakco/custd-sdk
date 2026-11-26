<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

final readonly class OAuthClientUpdateScopesRequest
{
    /**
     * @param list<string> $scopes
     */
    public function __construct(
        public string $companySlug,
        public string $profile,
        public array $scopes,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'profile' => $this->profile,
            'scopes' => $this->scopes,
        ];

        return $body;
    }
}
