<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchConnectionStatus is the import state of one provider connection. */
final class SiteSearchConnectionStatus
{
    /** Connected, not yet imported. */
    public const PENDING = 'pending';
    public const ACTIVE = 'active';
    /** The latest import failed; lastFailure says why. */
    public const FAILING = 'failing';
    /** The provider no longer lets Custd read the property. */
    public const REVOKED = 'revoked';
}
