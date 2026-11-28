<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageReadResponse
{
    public function __construct(
        public AppMessage $message,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AppMessage::fromPayload(Fields::object($payload, 'message')),
        );
    }
}
