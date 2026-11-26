<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

use HaakCo\Custd\Fields;

/**
 * MachineAccessEffective is one machine's effective access: its scopes, each area's result, and how many of the
 * areas it can use.
 */
final readonly class MachineAccessEffective
{
    /**
     * @param list<string> $scopes
     * @param list<MachineAccessEffectiveArea> $areas
     */
    public function __construct(
        public string $companySlug,
        public string $clientId,
        public array $scopes,
        public int $allowedAreas,
        public int $totalAreas,
        public array $areas,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'clientId'),
            Fields::strings($payload, 'scopes'),
            Fields::integer($payload, 'allowedAreas'),
            Fields::integer($payload, 'totalAreas'),
            array_map(MachineAccessEffectiveArea::fromPayload(...), Fields::objects($payload, 'areas')),
        );
    }
}
