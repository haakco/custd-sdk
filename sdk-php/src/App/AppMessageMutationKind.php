<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

enum AppMessageMutationKind: string
{
    case Edit = 'edit';
    case Revoke = 'revoke';
}
