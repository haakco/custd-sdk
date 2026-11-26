<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * PrivateUptimeMonitor checks a domain from inside a private network through an agent that reports
 * to Custd. requestedAt is set while an on-demand check is waiting for the agent.
 */
final readonly class PrivateUptimeMonitor
{
    /**
     * @param PrivateUptimeStatus::* $status
     */
    public function __construct(
        public string $monitorUuid,
        public string $networkLabel,
        public string $status,
        public ?PrivateUptimeReport $latest = null,
        public ?string $requestedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $latest = Fields::optionalObject($payload, 'latest');

        return new self(
            Fields::string($payload, 'monitorUuid'),
            Fields::string($payload, 'networkLabel'),
            Fields::string($payload, 'status'),
            $latest === null ? null : PrivateUptimeReport::fromPayload($latest),
            Fields::optionalString($payload, 'requestedAt'),
        );
    }
}
