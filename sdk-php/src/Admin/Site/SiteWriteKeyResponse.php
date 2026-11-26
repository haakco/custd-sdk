<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Site;

use HaakCo\Custd\Fields;

final readonly class SiteWriteKeyResponse
{
    public function __construct(
        public string $writeKey,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'writeKey'),
        );
    }
}
