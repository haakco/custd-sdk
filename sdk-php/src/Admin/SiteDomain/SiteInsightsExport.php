<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteInsightsExport is everything Custd keeps about one domain, read in one call so a client can
 * take its data elsewhere. The daily search metric rows are not inlined: search->metricRows says
 * how many there are and SiteExportClient::listSearchMetrics() pages through them.
 */
final readonly class SiteInsightsExport
{
    /** The schema every export of this shape names. */
    public const SCHEMA = 'custd.site-insights-export.v1';

    public function __construct(
        public string $schema,
        public string $exportedAt,
        public SiteDomain $domain,
        public SiteInsightsMonitoringExport $monitoring,
        public SiteInsightsSearchExport $search,
        public SiteInsightsReportsExport $reports,
        public SiteInsightsSiteExport $site,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'schema'),
            Fields::string($payload, 'exportedAt'),
            SiteDomain::fromPayload(Fields::object($payload, 'domain')),
            SiteInsightsMonitoringExport::fromPayload(Fields::object($payload, 'monitoring')),
            SiteInsightsSearchExport::fromPayload(Fields::object($payload, 'search')),
            SiteInsightsReportsExport::fromPayload(Fields::object($payload, 'reports')),
            SiteInsightsSiteExport::fromPayload(Fields::object($payload, 'site')),
        );
    }
}
