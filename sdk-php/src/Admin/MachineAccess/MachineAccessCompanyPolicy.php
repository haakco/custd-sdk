<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

use HaakCo\Custd\Fields;

/**
 * MachineAccessCompanyPolicy is the company default for every area and whether Custd support automation may act
 * in the company.
 */
final readonly class MachineAccessCompanyPolicy
{
    /**
     * @param list<MachineAccessAreaSetting> $areas
     */
    public function __construct(
        public string $companySlug,
        public bool $allowSupportAutomation,
        public array $areas,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::boolean($payload, 'allowSupportAutomation'),
            array_map(MachineAccessAreaSetting::fromPayload(...), Fields::objects($payload, 'areas')),
        );
    }
}
