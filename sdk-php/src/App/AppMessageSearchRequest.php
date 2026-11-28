<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageSearchRequest
{
    public function __construct(
        public ?string $query = null,
        public ?string $sender = null,
        public ?AppMessageSource $source = null,
        public ?string $threadId = null,
        public ?string $from = null,
        public ?string $to = null,
        public ?int $limit = null,
        public ?string $cursor = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return array_filter([
            'query' => $this->query,
            'sender' => $this->sender,
            'source' => $this->source?->value,
            'threadId' => $this->threadId,
            'from' => $this->from,
            'to' => $this->to,
            'limit' => $this->limit,
            'cursor' => $this->cursor,
        ], static fn (mixed $value): bool => $value !== null);
    }
}
