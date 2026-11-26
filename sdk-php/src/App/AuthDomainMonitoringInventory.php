<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

/**
 * AuthDomainMonitoringInventory names the realm hostnames to probe, and apart from them the hosts being retired.
 */
final readonly class AuthDomainMonitoringInventory
{
    /**
     * @param list<string> $hosts
     * @param list<string> $retiredHosts
     */
    public function __construct(
        public array $hosts,
        public array $retiredHosts,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::strings($payload, 'hosts'),
            Fields::strings($payload, 'retiredHosts'),
        );
    }
}
