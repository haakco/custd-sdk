<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

use HaakCo\Custd\Fields;

/**
 * MachineAccessAreaSetting is one area and its state; see MachineAccessArea and MachineAccessState.
 */
final readonly class MachineAccessAreaSetting
{
    public function __construct(
        public string $area,
        public string $state,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'area'), Fields::string($payload, 'state'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['area' => $this->area, 'state' => $this->state];
    }

    /**
     * @param list<self> $areas
     * @return list<array<string, mixed>>
     */
    public static function serialiseAll(array $areas): array
    {
        return array_map(static fn (self $area): array => $area->serialise(), $areas);
    }
}
