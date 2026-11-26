<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

final readonly class MachineAccessMachineUpdateRequest
{
    /**
     * @param list<MachineAccessAreaSetting> $areas
     */
    public function __construct(
        public array $areas,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['areas' => MachineAccessAreaSetting::serialiseAll($this->areas)];
    }
}
