<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientAdmissionMetadata
{
    /**
     * @param list<string> $redirectUris
     */
    public function __construct(
        public string $clientName,
        public string $expiresAt,
        public array $redirectUris,
        public string $securityRevision,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'clientName'),
            Fields::string($payload, 'expiresAt'),
            Fields::strings($payload, 'redirectUris'),
            Fields::string($payload, 'securityRevision'),
        );
    }
}
