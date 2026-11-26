<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** HostedSignIn is the public client a hosted application signs people in with. */
final readonly class HostedSignIn
{
    public function __construct(
        public string $clientId,
        public string $audience,
        public string $redirectUri,
        public string $postLogoutRedirectUri,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'audience'),
            Fields::string($payload, 'redirectUri'),
            Fields::string($payload, 'postLogoutRedirectUri'),
        );
    }
}
