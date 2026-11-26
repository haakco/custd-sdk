<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectDomainLifecycle names the values of AuthDomainBinding.lifecycle.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectDomainLifecycle
{
    public const UNCLAIMED = 'unclaimed';
    public const ADMITTED = 'admitted';
    public const PAUSED = 'paused';
    public const RETIRING = 'retiring';
    public const RETIRED = 'retired';
}
