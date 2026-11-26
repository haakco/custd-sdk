<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

/**
 * AppDiscoverySignIn is the browser sign-in registration of a hosted application that signs people in.
 */
final readonly class AppDiscoverySignIn
{
    public function __construct(
        public string $issuer,
        public string $authorizationEndpoint,
        public string $tokenEndpoint,
        public string $endSessionEndpoint,
        public string $clientId,
        public string $audience,
        public string $redirectUri,
        public string $postLogoutRedirectUri,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'issuer'),
            Fields::string($payload, 'authorizationEndpoint'),
            Fields::string($payload, 'tokenEndpoint'),
            Fields::string($payload, 'endSessionEndpoint'),
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'audience'),
            Fields::string($payload, 'redirectUri'),
            Fields::string($payload, 'postLogoutRedirectUri'),
        );
    }
}
