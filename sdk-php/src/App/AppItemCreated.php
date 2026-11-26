<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemCreated
{
    public function __construct(
        public AppItemRead $item,
        public string $ownerToken,
        public string $shareToken,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AppItemRead::fromPayload(Fields::object($payload, 'item')),
            Fields::string($payload, 'ownerToken'),
            Fields::string($payload, 'shareToken'),
        );
    }
}
