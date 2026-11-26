<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** ProducerSecretRotation is a producer's replacement secret, shown once; the previous secret stops working. */
final readonly class ProducerSecretRotation
{
    public function __construct(
        public string $baseUrl,
        public string $tokenUrl,
        public string $audience,
        public string $clientId,
        public string $clientSecret,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'baseUrl'),
            Fields::string($payload, 'tokenUrl'),
            Fields::string($payload, 'audience'),
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'clientSecret'),
        );
    }
}
