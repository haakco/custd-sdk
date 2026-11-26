<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteUptime is the latest home page check. */
final readonly class SiteUptime
{
    /**
     * @param SiteUptimeStatus::* $status
     */
    public function __construct(
        public string $status,
        public int $consecutiveFailures = 0,
        public ?string $lastCheckedAt = null,
        public ?int $statusCode = null,
        public ?int $responseMs = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'consecutiveFailures'),
            Fields::optionalString($payload, 'lastCheckedAt'),
            Fields::optionalInteger($payload, 'statusCode'),
            Fields::optionalInteger($payload, 'responseMs'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
