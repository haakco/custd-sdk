<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

/**
 * AuditScope names which audit events a list reads: the tenant's own or the platform-wide events.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuditScope
{
    public const TENANT = 'tenant';
    public const GLOBAL = 'global';
}
