<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteReport is the client report of one domain, built from the TEMPLATE_* layout it names. template
 * is null on servers before the template field; the server's default template is full.
 */
final readonly class SiteReport
{
    /** The short summary for a site owner. */
    public const TEMPLATE_EXECUTIVE = 'executive';
    /** Every section; the default. */
    public const TEMPLATE_FULL = 'full';

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
        public ?string $template = null,
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
            Fields::optionalString($payload, 'template'),
        );
    }
}
