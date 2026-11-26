<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteDomainVerifiedBy names the values of SiteDomainOwnership.verifiedBy.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteDomainVerifiedBy
{
    public const DNS = 'dns';
    public const FILE = 'file';
    public const ATTESTED = 'attested';
    public const PARENT = 'parent';
    public const OPERATOR = 'operator';
}
