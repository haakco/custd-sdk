<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchConnectionStatus is the import state of one provider connection. */
enum SiteSearchConnectionStatus: string
{
    /** Connected, not yet imported. */
    case Pending = 'pending';
    case Active = 'active';
    /** The latest import failed; lastFailure says why. */
    case Failing = 'failing';
    /** The provider no longer lets Custd read the property. */
    case Revoked = 'revoked';
}
