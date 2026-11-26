<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteReportTemplate names the values of SavedSiteReport.template, SavedSiteReportRequest.template,
 * SavedSiteReportSummary.template, SiteReport.template.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteReportTemplate
{
    public const EXECUTIVE = 'executive';
    public const FULL = 'full';
}
