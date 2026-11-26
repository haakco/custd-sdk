<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

/**
 * MachineAccessDecidedBy names the setting that decided an area, and in a refusal the one that blocked it.
 */
final class MachineAccessDecidedBy
{
    public const COMPANY = 'company';
    public const MACHINE = 'machine';
    /** The target company's "Allow Custd support automation" setting, which binds Custd's platform machine. */
    public const SUPPORT_AUTOMATION = 'support_automation';
}
