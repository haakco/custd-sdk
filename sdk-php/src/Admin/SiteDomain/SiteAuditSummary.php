<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteAuditSummary counts one audit run's findings by severity. */
final readonly class SiteAuditSummary
{
    public function __construct(
        public int $high,
        public int $medium,
        public int $low,
        public int $info,
        public int $pagesChecked,
        public int $requests,
        public bool $truncated,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'high'),
            Fields::integer($payload, 'medium'),
            Fields::integer($payload, 'low'),
            Fields::integer($payload, 'info'),
            Fields::integer($payload, 'pagesChecked'),
            Fields::integer($payload, 'requests'),
            Fields::boolean($payload, 'truncated'),
        );
    }
}
