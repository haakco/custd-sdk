<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReport
{
    /**
     * @param list<SiteReportSpeed> $speed
     */
    public function __construct(
        public string $host,
        public string $generatedAt,
        public SiteReportUptime $uptime,
        public SiteReportCertificate $certificate,
        public array $speed,
        public SiteReportSearch $search,
        public SiteReportAudit $audit,
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
        );
    }
}
