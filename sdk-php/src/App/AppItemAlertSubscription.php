<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemAlertSubscription
{
    public function __construct(
        public string $createdAt,
        public string $subscriptionUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'subscriptionUuid'),
        );
    }
}
