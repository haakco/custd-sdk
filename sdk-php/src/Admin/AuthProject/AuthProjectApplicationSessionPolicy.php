<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectApplicationSessionPolicy names the values of DesiredState.applicationSessionPolicy.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectApplicationSessionPolicy
{
    public const OFFER_REMEMBER_ME = 'offer_remember_me';
    public const SHORT_ONLY = 'short_only';
}
