<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class AuditNetworkDisclosure
{
    /**
     * @param AuditDisclosureState::* $ipAddressState
     * @param AuditDisclosureState::* $userAgentState
     */
    public function __construct(
        public string $ipAddressState,
        public string $userAgentState,
        public ?string $ipAddress = null,
        public ?string $userAgent = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'ipAddressState'),
            Fields::string($payload, 'userAgentState'),
            Fields::optionalString($payload, 'ipAddress'),
            Fields::optionalString($payload, 'userAgent'),
        );
    }
}
