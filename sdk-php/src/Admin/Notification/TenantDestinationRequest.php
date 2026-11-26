<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

final readonly class TenantDestinationRequest
{
    public function __construct(
        public string $channel,
        public bool $enabled,
        public ?string $emailRecipient = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'channel' => $this->channel,
            'enabled' => $this->enabled,
        ];
        if ($this->emailRecipient !== null) {
            $body['emailRecipient'] = $this->emailRecipient;
        }

        return $body;
    }
}
