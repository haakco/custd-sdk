<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientCreateResponse
{
    /**
     * @param list<string> $scopes
     */
    public function __construct(
        public string $clientId,
        public string $companySlug,
        public string $profile,
        public array $scopes,
        public ?string $clientSecret = null,
        public ?OAuthClientLoginSetup $loginSetup = null,
        public ?string $purposeProfile = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $loginSetup = Fields::optionalObject($payload, 'loginSetup');

        return new self(
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'profile'),
            Fields::strings($payload, 'scopes'),
            Fields::optionalString($payload, 'clientSecret'),
            $loginSetup === null ? null : OAuthClientLoginSetup::fromPayload($loginSetup),
            Fields::optionalString($payload, 'purposeProfile'),
        );
    }
}
