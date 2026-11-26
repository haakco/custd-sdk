<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectDomainConvergence names the values of AuthDomainImages.convergence.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectDomainConvergence
{
    public const CONVERGED = 'converged';
    public const DRIFTED = 'drifted';
    public const NOT_RUNNING = 'not-running';
    public const UNVERIFIED = 'unverified';
    public const ROLLING_OUT = 'rolling-out';
}
