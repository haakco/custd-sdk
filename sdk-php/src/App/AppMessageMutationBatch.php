<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageMutationBatch
{
    /** @param list<AppMessageMutation> $mutations */
    public function __construct(
        public AppMessageSource $source,
        public array $mutations,
        public int $sourceGeneration,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'source' => $this->source->value,
            'mutations' => array_map(static fn (AppMessageMutation $item): array => $item->serialise(), $this->mutations),
            'sourceGeneration' => $this->sourceGeneration,
        ];
    }
}
