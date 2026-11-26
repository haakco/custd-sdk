<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

use HaakCo\Custd\Fields;

final readonly class TenantDestination
{
    public function __construct(
        public string $channel,
        public bool $configured,
        public bool $enabled,
        public string $eventSlug,
        public ?string $emailRecipient = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'channel'),
            Fields::boolean($payload, 'configured'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'eventSlug'),
            Fields::optionalString($payload, 'emailRecipient'),
        );
    }
}
