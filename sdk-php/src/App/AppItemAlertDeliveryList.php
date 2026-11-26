<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemAlertDeliveryList
{
    /**
     * @param list<AppItemAlertDelivery> $deliveries
     */
    public function __construct(
        public array $deliveries,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppItemAlertDelivery::fromPayload(...), Fields::objects($payload, 'deliveries')),
        );
    }
}
