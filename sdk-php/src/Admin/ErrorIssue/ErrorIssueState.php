<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

/**
 * ErrorIssueState names the values of ErrorIssue.state, ErrorIssueStateRequest.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class ErrorIssueState
{
    public const OPEN = 'open';
    public const RESOLVED = 'resolved';
    public const IGNORED = 'ignored';
}
