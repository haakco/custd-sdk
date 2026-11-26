<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

final readonly class OAuthClientCreateRequest
{
    /**
     * @param list<string> $scopes
     */
    public function __construct(
        public string $clientId,
        public string $companySlug,
        public string $profile,
        public array $scopes,
        public ?string $environment = null,
        public ?string $purposeProfile = null,
        public ?string $siteUuid = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'clientId' => $this->clientId,
            'companySlug' => $this->companySlug,
            'profile' => $this->profile,
            'scopes' => $this->scopes,
        ];
        if ($this->environment !== null) {
            $body['environment'] = $this->environment;
        }
        if ($this->purposeProfile !== null) {
            $body['purposeProfile'] = $this->purposeProfile;
        }
        if ($this->siteUuid !== null) {
            $body['siteUuid'] = $this->siteUuid;
        }

        return $body;
    }
}
