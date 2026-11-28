<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageBatchRequest
{
    /**
     * @param list<AppMessageInput> $messages
     */
    public function __construct(
        public AppMessageSource $source,
        public array $messages,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'source' => $this->source->value,
            'messages' => array_map(static fn (AppMessageInput $item): array => $item->serialise(), $this->messages),
        ];
    }
}
