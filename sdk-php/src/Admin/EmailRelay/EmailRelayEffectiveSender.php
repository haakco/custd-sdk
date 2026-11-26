<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

use HaakCo\Custd\Fields;

final readonly class EmailRelayEffectiveSender
{
    public function __construct(
        public string $fromAddress,
        public string $fromDisplayName,
        public bool $hasCredential,
        public string $relay,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'fromAddress'),
            Fields::string($payload, 'fromDisplayName'),
            Fields::boolean($payload, 'hasCredential'),
            Fields::string($payload, 'relay'),
        );
    }
}
