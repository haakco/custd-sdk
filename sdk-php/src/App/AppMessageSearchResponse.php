<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageSearchResponse
{
    /**
     * @param list<AppMessage> $messages
     */
    public function __construct(
        public array $messages,
        public ?string $nextCursor,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppMessage::fromPayload(...), Fields::objects($payload, 'messages')),
            Fields::optionalString($payload, 'nextCursor'),
        );
    }
}
