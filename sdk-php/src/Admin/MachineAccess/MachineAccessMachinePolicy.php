<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

use HaakCo\Custd\Fields;

/**
 * MachineAccessMachinePolicy is one machine's own per-area override.
 */
final readonly class MachineAccessMachinePolicy
{
    /**
     * @param list<MachineAccessAreaSetting> $areas
     */
    public function __construct(
        public string $companySlug,
        public string $clientId,
        public array $areas,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'clientId'),
            array_map(MachineAccessAreaSetting::fromPayload(...), Fields::objects($payload, 'areas')),
        );
    }
}
