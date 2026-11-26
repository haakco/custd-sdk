<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * RuleIdentity names the values of ActivationRule.identity, ActivityRule.identity, TransitionRule.identity.
 * A value Custd adds later still decodes as a plain string.
 */
final class RuleIdentity
{
    public const SUBJECT = 'subject';
    public const SESSION = 'session';
    public const CORRELATION = 'correlation';
}
