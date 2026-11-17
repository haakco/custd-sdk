<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportAudit
{
    /**
     * @param list<SiteReportFinding> $findings
     */
    public function __construct(
        public array $findings,
        public ?string $auditedAt = null,
        public ?SiteAuditSummary $summary = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $summary = Fields::optionalObject($payload, 'summary');

        return new self(
            array_map(SiteReportFinding::fromPayload(...), Fields::objects($payload, 'findings')),
            Fields::optionalString($payload, 'auditedAt'),
            $summary === null ? null : SiteAuditSummary::fromPayload($summary),
        );
    }
}
