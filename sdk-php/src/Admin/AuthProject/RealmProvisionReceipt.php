<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * RealmProvisionReceipt reports what each realm step wrote and, when a step
 * failed or the realm did not converge, which one. It always carries the steps
 * that completed, so a caller can resume from `failedStep` rather than repeating
 * the whole provision. `failedStep` is null only when every step completed and
 * the realm converged.
 */
final readonly class RealmProvisionReceipt
{
    public function __construct(
        public string $projectId = '',
        public string $environmentId = '',
        public ?Operation $apply = null,
        public ?Operation $directory = null,
        public ?ClientSyncReport $reconcile = null,
        public ?Status $status = null,
        public ?RealmProvisionStep $failedStep = null,
    ) {
    }
}
