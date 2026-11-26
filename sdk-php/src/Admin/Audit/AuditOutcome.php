<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

/**
 * AuditOutcome names the values of AuditEvent.outcome.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuditOutcome
{
    public const ATTEMPTED = 'attempted';
    public const SUCCESS = 'success';
    public const FAILURE = 'failure';
    public const DENIED = 'denied';
    public const PENDING = 'pending';
    public const UNKNOWN = 'unknown';
}
