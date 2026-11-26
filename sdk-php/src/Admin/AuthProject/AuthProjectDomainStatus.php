<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectDomainStatus names the values of AuthDomainBinding.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectDomainStatus
{
    public const PENDING = 'pending';
    public const ACTIVE = 'active';
    public const PROOF_WITHDRAWN = 'proof-withdrawn';
    public const DISABLED = 'disabled';
    public const RELEASING = 'releasing';
}
