<?php

declare(strict_types=1);

namespace HaakCo\Custd;

final class MemoryQueueStore implements QueueStore
{
    /** @var array<int, array<string, mixed>> */
    private array $events = [];

    public function load(): array
    {
        return $this->events;
    }

    public function save(array $events): void
    {
        $this->events = $events;
    }

    public function clear(): void
    {
        $this->events = [];
    }
}
