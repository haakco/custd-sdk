<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

/**
 * ErrorIssueListState selects which error issues a list returns: one ErrorIssueState, or all.
 * A value Custd adds later still decodes as a plain string.
 */
final class ErrorIssueListState
{
    public const OPEN = 'open';
    public const RESOLVED = 'resolved';
    public const IGNORED = 'ignored';
    public const ALL = 'all';
}
