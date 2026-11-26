<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteReport is the client report of one domain, built from the SiteReportTemplate layout it names. nextActions
 * are the first three of SiteNextActionClient::forDomain(), and empty in reports built or saved
 * before servers sent them.
 */
final readonly class SiteReport
{
    /**
     * @param list<SiteReportSpeed> $speed
     * @param list<SiteNextAction> $nextActions
     * @param SiteReportTemplate::* $template
     */
    public function __construct(
        public string $host,
        public string $generatedAt,
        public SiteReportUptime $uptime,
        public SiteReportCertificate $certificate,
        public array $speed,
        public SiteReportSearch $search,
        public SiteReportAudit $audit,
        public string $template,
        public array $nextActions = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'host'),
            Fields::string($payload, 'generatedAt'),
            SiteReportUptime::fromPayload(Fields::object($payload, 'uptime')),
            SiteReportCertificate::fromPayload(Fields::object($payload, 'certificate')),
            array_map(SiteReportSpeed::fromPayload(...), Fields::objects($payload, 'speed')),
            SiteReportSearch::fromPayload(Fields::object($payload, 'search')),
            SiteReportAudit::fromPayload(Fields::object($payload, 'audit')),
            Fields::string($payload, 'template'),
            array_map(SiteNextAction::fromPayload(...), Fields::optionalObjects($payload, 'nextActions') ?? []),
        );
    }
}
