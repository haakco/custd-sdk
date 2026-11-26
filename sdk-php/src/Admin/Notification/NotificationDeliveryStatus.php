<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

use HaakCo\Custd\Fields;

final readonly class NotificationDeliveryStatus
{
    public function __construct(
        public int $attemptCount,
        public string $channel,
        public string $createdAt,
        public string $deliveryUuid,
        public string $messageUuid,
        public string $state,
        public string $templateId,
        public string $updatedAt,
        public ?string $failureReason = null,
        public ?string $lastErrorClass = null,
        public ?string $nextAction = null,
        public ?string $providerMessageId = null,
        public ?string $sentAt = null,
        public ?string $terminalAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'attemptCount'),
            Fields::string($payload, 'channel'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'deliveryUuid'),
            Fields::string($payload, 'messageUuid'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'templateId'),
            Fields::string($payload, 'updatedAt'),
            Fields::optionalString($payload, 'failureReason'),
            Fields::optionalString($payload, 'lastErrorClass'),
            Fields::optionalString($payload, 'nextAction'),
            Fields::optionalString($payload, 'providerMessageId'),
            Fields::optionalString($payload, 'sentAt'),
            Fields::optionalString($payload, 'terminalAt'),
        );
    }
}
