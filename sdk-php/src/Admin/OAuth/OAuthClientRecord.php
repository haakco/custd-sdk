<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientRecord
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
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'profile'),
            Fields::strings($payload, 'scopes'),
            Fields::optionalString($payload, 'environment'),
            Fields::optionalString($payload, 'purposeProfile'),
        );
    }
}
