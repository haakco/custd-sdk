<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientAdmissionMutationResponse
{
    public function __construct(
        public OAuthClientAdmission $admission,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            OAuthClientAdmission::fromPayload(Fields::object($payload, 'admission')),
        );
    }
}
