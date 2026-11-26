<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

final readonly class NotificationWebhookCreateRequest
{
    /**
     * @param NotificationWebhookKind::*|null $kind
     */
    public function __construct(
        public string $companySlug,
        public bool $enabled,
        public string $endpoint,
        public string $name,
        public ?string $kind = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'enabled' => $this->enabled,
            'endpoint' => $this->endpoint,
            'name' => $this->name,
        ];
        if ($this->kind !== null) {
            $body['kind'] = $this->kind;
        }

        return $body;
    }
}
