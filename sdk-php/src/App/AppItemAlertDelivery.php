<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemAlertDelivery
{
    /**
     * @param AppAlertChannel::* $channel
     * @param AppAlertDeliveryOutcome::* $outcome
     */
    public function __construct(
        public int $attempts,
        public string $channel,
        public string $createdAt,
        public int $crossing,
        public string $deliveryUuid,
        public string $outcome,
        public string $ruleType,
        public string $ruleUuid,
        public string $updatedAt,
        public ?string $lastErrorClass = null,
        public ?int $lastStatusCode = null,
        public ?string $webhookUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'attempts'),
            Fields::string($payload, 'channel'),
            Fields::string($payload, 'createdAt'),
            Fields::integer($payload, 'crossing'),
            Fields::string($payload, 'deliveryUuid'),
            Fields::string($payload, 'outcome'),
            Fields::string($payload, 'ruleType'),
            Fields::string($payload, 'ruleUuid'),
            Fields::string($payload, 'updatedAt'),
            Fields::optionalString($payload, 'lastErrorClass'),
            Fields::optionalInteger($payload, 'lastStatusCode'),
            Fields::optionalString($payload, 'webhookUuid'),
        );
    }
}
