<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

use HaakCo\Custd\Fields;

final readonly class PasswordResetResponse
{
    /**
     * @param list<string> $deliveryUuids
     */
    public function __construct(
        public array $deliveryUuids,
        public string $messageUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::strings($payload, 'deliveryUuids'),
            Fields::string($payload, 'messageUuid'),
        );
    }
}
