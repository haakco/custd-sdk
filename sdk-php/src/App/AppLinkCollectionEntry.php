<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppLinkCollectionEntry
{
    public function __construct(
        public string $createdAt,
        public string $entryUuid,
        public string $itemUuid,
        public string $kind,
        public int $position,
        public ?string $shareToken = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'entryUuid'),
            Fields::string($payload, 'itemUuid'),
            Fields::string($payload, 'kind'),
            Fields::integer($payload, 'position'),
            Fields::optionalString($payload, 'shareToken'),
        );
    }
}
