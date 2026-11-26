<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageAlertDelivery
{
    public function __construct(
        public string $state,
        public ?string $error = null,
        public ?string $updatedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'state'),
            Fields::optionalString($payload, 'error'),
            Fields::optionalString($payload, 'updatedAt'),
        );
    }
}
