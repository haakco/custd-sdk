<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientListResponse
{
    /**
     * @param list<OAuthClientRecord> $clients
     */
    public function __construct(
        public array $clients,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(OAuthClientRecord::fromPayload(...), Fields::objects($payload, 'clients')),
        );
    }
}
