<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemLinkRotated
{
    public function __construct(
        public AppItemLink $link,
        public string $token,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AppItemLink::fromPayload(Fields::object($payload, 'link')),
            Fields::string($payload, 'token'),
        );
    }
}
