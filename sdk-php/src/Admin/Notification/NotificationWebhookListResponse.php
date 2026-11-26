<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

use HaakCo\Custd\Fields;

final readonly class NotificationWebhookListResponse
{
    /**
     * @param list<NotificationWebhookSubscription> $subscriptions
     */
    public function __construct(
        public array $subscriptions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(NotificationWebhookSubscription::fromPayload(...), Fields::objects($payload, 'subscriptions')),
        );
    }
}
