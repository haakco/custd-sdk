<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAuditPageIndexability names the values of SiteAuditPage.indexability.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteAuditPageIndexability
{
    public const INDEXABLE = 'indexable';
    public const NOINDEX = 'noindex';
    public const CANONICALIZED = 'canonicalized';
    public const REDIRECTED = 'redirected';
    public const ERROR = 'error';
    public const NOT_HTML = 'not_html';
}
