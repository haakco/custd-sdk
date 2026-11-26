<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

use HaakCo\Custd\Fields;

/**
 * MachineAccessEffectiveArea is what a machine can do in one area and which setting decided it.
 */
final readonly class MachineAccessEffectiveArea
{
    public function __construct(
        public string $area,
        public bool $allowed,
        public string $decidedBy,
        public string $companyState,
        public string $machineState,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'area'),
            Fields::boolean($payload, 'allowed'),
            Fields::string($payload, 'decidedBy'),
            Fields::string($payload, 'companyState'),
            Fields::string($payload, 'machineState'),
        );
    }
}
