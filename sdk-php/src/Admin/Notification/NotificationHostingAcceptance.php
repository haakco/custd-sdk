<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

use HaakCo\Custd\Fields;

final readonly class NotificationHostingAcceptance
{
    /** @param list<string> $recipientIds */
    public function __construct(
        public string $acceptedAt,
        public string $messageId,
        public array $recipientIds,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'acceptedAt'),
            Fields::string($payload, 'messageId'),
            Fields::strings($payload, 'recipientIds'),
        );
    }
}
