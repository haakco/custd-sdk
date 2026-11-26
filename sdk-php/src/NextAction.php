<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * NextAction names the values of NextActionHint.action, ReportingNextActionHint.action.
 * A value Custd adds later still decodes as a plain string.
 */
final class NextAction
{
    public const NONE = 'none';
    public const POLL = 'poll';
    public const RETRY = 'retry';
    public const ROTATE = 'rotate';
    public const ESCALATE = 'escalate';
}
