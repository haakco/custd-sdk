<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

/**
 * ErrorIssueSort names how an error issue list is ordered.
 * A value Custd adds later still decodes as a plain string.
 */
final class ErrorIssueSort
{
    public const RECENT = 'recent';
    public const FREQUENT = 'frequent';
}
