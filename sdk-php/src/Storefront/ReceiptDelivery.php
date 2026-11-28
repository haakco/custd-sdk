<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ReceiptDelivery
{
    public function __construct(
        public string $channel,
        public string $notificationSourceKey,
        public string $status,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'channel'),
            Fields::string($payload, 'notificationSourceKey'),
            Fields::string($payload, 'status'),
        );
    }
}
