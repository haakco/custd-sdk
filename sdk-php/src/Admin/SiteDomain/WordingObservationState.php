<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * WordingObservationState names the values of SiteWordingObservation.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class WordingObservationState
{
    public const UNREAD = 'unread';
    public const UNAVAILABLE = 'unavailable';
    public const SHORT = 'short';
    public const READY = 'ready';
}
