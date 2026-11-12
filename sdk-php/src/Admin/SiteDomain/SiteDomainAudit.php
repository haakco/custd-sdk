<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteDomainAudit is the scheduled audit's state for one domain. */
final readonly class SiteDomainAudit
{
    public function __construct(
        public ?string $requestedAt = null,
        public ?string $lastAuditedAt = null,
        public ?SiteAuditSummary $lastSummary = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $summary = Fields::optionalObject($payload, 'lastSummary');

        return new self(
            Fields::optionalString($payload, 'requestedAt'),
            Fields::optionalString($payload, 'lastAuditedAt'),
            $summary === null ? null : SiteAuditSummary::fromPayload($summary),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
