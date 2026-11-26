<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

final readonly class NotificationWebhookEnabledRequest
{
    public function __construct(
        public bool $enabled,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'enabled' => $this->enabled,
        ];

        return $body;
    }
}
