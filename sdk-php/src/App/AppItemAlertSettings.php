<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemAlertSettings
{
    /**
     * @param list<AppItemAlertRule> $rules
     * @param list<AppItemAlertWebhook> $webhooks
     */
    public function __construct(
        public bool $deliveryAvailable,
        public array $rules,
        public array $webhooks,
        public ?AppItemAlertSubscription $subscription = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $subscription = Fields::optionalObject($payload, 'subscription');

        return new self(
            Fields::boolean($payload, 'deliveryAvailable'),
            array_map(AppItemAlertRule::fromPayload(...), Fields::objects($payload, 'rules')),
            array_map(AppItemAlertWebhook::fromPayload(...), Fields::objects($payload, 'webhooks')),
            $subscription === null ? null : AppItemAlertSubscription::fromPayload($subscription),
        );
    }
}
