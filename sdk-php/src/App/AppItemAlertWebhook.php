<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemAlertWebhook
{
    /**
     * @param AppAlertDestinationKind::* $kind
     */
    public function __construct(
        public string $createdAt,
        public string $endpoint,
        public string $kind,
        public string $webhookUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'endpoint'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'webhookUuid'),
        );
    }
}
