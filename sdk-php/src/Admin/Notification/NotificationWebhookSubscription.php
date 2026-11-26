<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

use HaakCo\Custd\Fields;

final readonly class NotificationWebhookSubscription
{
    public function __construct(
        public string $createdAt,
        public bool $enabled,
        public string $endpoint,
        public string $kind,
        public string $name,
        public string $updatedAt,
        public string $uuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'endpoint'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'updatedAt'),
            Fields::string($payload, 'uuid'),
        );
    }
}
