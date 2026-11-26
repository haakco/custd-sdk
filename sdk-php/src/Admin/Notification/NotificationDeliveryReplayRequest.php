<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

final readonly class NotificationDeliveryReplayRequest
{
    public function __construct(
        public string $reason,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'reason' => $this->reason,
        ];

        return $body;
    }
}
