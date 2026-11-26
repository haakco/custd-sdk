<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

/**
 * AppSignInMode names the values of AppSignInRequest.mode.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppSignInMode
{
    public const OFF = 'off';
    public const INVITE_ONLY = 'invite_only';
    public const OPEN = 'open';
}
