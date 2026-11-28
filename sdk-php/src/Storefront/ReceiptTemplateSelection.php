<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ReceiptTemplateSelection
{
    public function __construct(
        public ?string $revision = null,
        public ?string $selectedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'revision'),
            Fields::optionalString($payload, 'selectedAt'),
        );
    }
}
