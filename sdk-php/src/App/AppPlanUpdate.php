<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppPlanUpdate
{
    /**
     * @param list<AppPlanPartUpdate> $parts
     */
    public function __construct(
        public int $expectedRevision,
        public array $parts,
        public ?string $deadline = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'expectedRevision' => $this->expectedRevision,
            'parts' => array_map(static fn (AppPlanPartUpdate $item): array => $item->serialise(), $this->parts),
        ];
        if ($this->deadline !== null) {
            $body['deadline'] = $this->deadline;
        }

        return $body;
    }
}
