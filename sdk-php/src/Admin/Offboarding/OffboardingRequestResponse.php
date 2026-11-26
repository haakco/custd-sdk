<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class OffboardingRequestResponse
{
    public function __construct(
        public string $requestUuid,
        public string $requestedAt,
        public string $state,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'requestUuid'),
            Fields::string($payload, 'requestedAt'),
            Fields::string($payload, 'state'),
        );
    }
}
