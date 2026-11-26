<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** ProducerSigningKeys is the set of public keys Custd now verifies a producer's signed events with. */
final readonly class ProducerSigningKeys
{
    /** @param list<string> $publicKeys */
    public function __construct(
        public string $clientId,
        public string $companySlug,
        public array $publicKeys,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'companySlug'),
            Fields::strings($payload, 'publicKeys'),
        );
    }
}
