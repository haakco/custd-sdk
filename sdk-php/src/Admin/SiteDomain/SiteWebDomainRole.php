<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteWebDomainRole names the values of SiteReferringDomains.role, SiteWebDomain.role.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteWebDomainRole
{
    public const OWN = 'own';
    public const COMPETITOR = 'competitor';
}
