<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientLoginSetup
{
    /**
     * @param list<string> $redirectUris
     * @param list<string> $scopes
     */
    public function __construct(
        public string $apiUrl,
        public string $audience,
        public string $clientId,
        public string $configInitCommand,
        public string $issuerUrl,
        public string $profileName,
        public array $redirectUris,
        public array $scopes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'apiUrl'),
            Fields::string($payload, 'audience'),
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'configInitCommand'),
            Fields::string($payload, 'issuerUrl'),
            Fields::string($payload, 'profileName'),
            Fields::strings($payload, 'redirectUris'),
            Fields::strings($payload, 'scopes'),
        );
    }
}
