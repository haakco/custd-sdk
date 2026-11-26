<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * MachineAccessBlock is why a machine access setting refused a request: the area, which setting blocked it
 * (company, machine or support_automation; see Admin\MachineAccess\MachineAccessDecidedBy), and the company and
 * client it applied to.
 */
final readonly class MachineAccessBlock
{
    public function __construct(
        public string $area,
        public string $blockedBy,
        public string $companySlug,
        public string $clientId,
    ) {
    }

    /** @param array<mixed> $decoded */
    public static function fromArray(array $decoded): self
    {
        return new self(
            is_string($decoded['area'] ?? null) ? $decoded['area'] : '',
            is_string($decoded['blockedBy'] ?? null) ? $decoded['blockedBy'] : '',
            is_string($decoded['companySlug'] ?? null) ? $decoded['companySlug'] : '',
            is_string($decoded['clientId'] ?? null) ? $decoded['clientId'] : '',
        );
    }
}
