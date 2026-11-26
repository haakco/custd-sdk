<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class QuantityError
{
    public function __construct(
        public string $code,
        public string $detail,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'code'),
            Fields::string($payload, 'detail'),
        );
    }
}
