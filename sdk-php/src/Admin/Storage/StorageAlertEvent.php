<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageAlertEvent
{
    /**
     * @param StorageAlertChannel::* $channel
     */
    public function __construct(
        public string $channel,
        public StorageAlertDelivery $delivery,
        public string $eventId,
        public StorageAlertMeasurement $measurement,
        public string $metric,
        public string $tenantSlug,
        public string $triggeredAt,
        public ?string $emailRecipient = null,
        public ?string $ruleId = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'channel'),
            StorageAlertDelivery::fromPayload(Fields::object($payload, 'delivery')),
            Fields::string($payload, 'eventId'),
            StorageAlertMeasurement::fromPayload(Fields::object($payload, 'measurement')),
            Fields::string($payload, 'metric'),
            Fields::string($payload, 'tenantSlug'),
            Fields::string($payload, 'triggeredAt'),
            Fields::optionalString($payload, 'emailRecipient'),
            Fields::optionalString($payload, 'ruleId'),
        );
    }
}
