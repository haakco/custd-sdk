<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppItemAlertWebhookCreateRequest
{
    public function __construct(
        public string $endpoint,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'endpoint' => $this->endpoint,
        ];

        return $body;
    }
}
