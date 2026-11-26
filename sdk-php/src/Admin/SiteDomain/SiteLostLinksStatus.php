<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteLostLinksStatus names the values of SiteLostLinks.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteLostLinksStatus
{
    public const AVAILABLE = 'available';
    public const PENDING = 'pending';
    public const UNAVAILABLE = 'unavailable';
}
