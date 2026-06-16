<?php

declare(strict_types=1);

namespace HaakCo\Custd;

interface QueueStore
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function load(): array;

    /**
     * @param array<int, array<string, mixed>> $events
     */
    public function save(array $events): void;

    public function clear(): void;
}
