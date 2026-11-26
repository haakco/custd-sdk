<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppLinkCollection
{
    /**
     * @param list<AppLinkCollectionEntry> $entries
     */
    public function __construct(
        public array $entries,
        public ?string $name = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppLinkCollectionEntry::fromPayload(...), Fields::objects($payload, 'entries')),
            Fields::optionalString($payload, 'name'),
        );
    }
}
