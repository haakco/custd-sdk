<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

/**
 * MachineAccessState is one area's setting. A company setting is allowed or blocked; a machine override may also
 * inherit, which defers to the company setting.
 */
final class MachineAccessState
{
    public const ALLOWED = 'allowed';
    public const BLOCKED = 'blocked';
    public const INHERIT = 'inherit';
}
