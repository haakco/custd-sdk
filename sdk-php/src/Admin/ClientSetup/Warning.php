<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class Warning
{
    public function __construct(
        public string $code,
        public string $message,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'code'),
            Fields::string($payload, 'message'),
        );
    }
}
