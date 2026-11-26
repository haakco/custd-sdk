<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMeetingCreate
{
    /**
     * @param list<AppMeetingBlockCreate> $blocks
     */
    public function __construct(
        public array $blocks,
        public string $name,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'blocks' => array_map(static fn (AppMeetingBlockCreate $item): array => $item->serialise(), $this->blocks),
            'name' => $this->name,
        ];

        return $body;
    }
}
