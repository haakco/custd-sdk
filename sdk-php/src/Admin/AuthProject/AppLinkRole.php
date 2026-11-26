<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppLinkRole says whether the environment owns the linked item or has it shared. */
enum AppLinkRole: string
{
    case Owner = 'owner';
    case Share = 'share';
}
