<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

enum ApplicationIdentityTraitsStatus: string
{
    case Included = 'included';
    case Incomplete = 'incomplete';
    case IdentityAbsent = 'identity_absent';
    case DirectoryUnavailable = 'directory_unavailable';
    case ProviderUnreadable = 'provider_unreadable';
}
