<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Problem;

/**
 * AdminProblemException is an admin request refused with an RFC 9457 problem
 * body. It carries the decoded problem so a caller can branch on its `code`
 * instead of matching the message text.
 */
final class AdminProblemException extends \RuntimeException
{
    public function __construct(
        public readonly int $status,
        public readonly Problem $problem,
    ) {
        parent::__construct("custd: " . $problem->message(), $status);
    }
}
