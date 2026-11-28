<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessage
{
    /**
     * @param list<string> $participants
     * @param list<AppMessageMediaMetadata>|null $media
     */
    public function __construct(
        public string $messageUuid,
        public string $source,
        public string $externalId,
        public string $threadId,
        public string $sender,
        public array $participants,
        public string $timestamp,
        public string $direction,
        public string $text,
        public ?array $media,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'messageUuid'),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'externalId'),
            Fields::string($payload, 'threadId'),
            Fields::string($payload, 'sender'),
            Fields::strings($payload, 'participants'),
            Fields::string($payload, 'timestamp'),
            Fields::string($payload, 'direction'),
            Fields::string($payload, 'text'),
            ($media = Fields::optionalObjects($payload, 'media')) === null
                ? null : array_map(AppMessageMediaMetadata::fromPayload(...), $media),
        );
    }
}
