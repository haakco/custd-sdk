<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemAlertWebhookCreated
{
    public function __construct(
        public string $signingSecret,
        public AppItemAlertWebhook $webhook,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'signingSecret'),
            AppItemAlertWebhook::fromPayload(Fields::object($payload, 'webhook')),
        );
    }
}
