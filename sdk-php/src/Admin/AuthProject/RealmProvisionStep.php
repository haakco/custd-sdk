<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * RealmProvisionStep names the step a realm provision stopped at, so a caller
 * knows exactly where a partial provision halted without re-reading state.
 */
enum RealmProvisionStep: string
{
    case Apply = 'apply';
    case DirectoryEnable = 'directory_enable';
    case ClientReconcile = 'client_reconcile';
    case Status = 'status';
}
