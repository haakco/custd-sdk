<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppItemAlertSlackCreateRequest
{
    public function __construct(
        public string $webhookUrl,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'webhookUrl' => $this->webhookUrl,
        ];

        return $body;
    }
}
