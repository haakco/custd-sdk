<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientAdmissionGrant
{
    /**
     * @param list<string> $scopes
     */
    public function __construct(
        public string $resourceUri,
        public array $scopes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'resourceUri'),
            Fields::strings($payload, 'scopes'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'resourceUri' => $this->resourceUri,
            'scopes' => $this->scopes,
        ];

        return $body;
    }
}
