<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteLinkSourceStatus names the values of SiteLinkSourceTotal.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteLinkSourceStatus
{
    public const AVAILABLE = 'available';
    public const PENDING = 'pending';
    public const FAILED = 'failed';
    public const UNAVAILABLE = 'unavailable';
}
