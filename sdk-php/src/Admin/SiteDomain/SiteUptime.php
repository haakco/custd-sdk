<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteUptime is the latest home page check. */
final readonly class SiteUptime
{
    public function __construct(
        public SiteUptimeStatus $status,
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
            SiteUptimeStatus::from(Fields::string($payload, 'status')),
            Fields::integer($payload, 'consecutiveFailures'),
            Fields::optionalString($payload, 'lastCheckedAt'),
            Fields::optionalInteger($payload, 'statusCode'),
            Fields::optionalInteger($payload, 'responseMs'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
