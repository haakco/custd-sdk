<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * RealmProvisionException is raised when a realm provision stops early, either
 * because a step was refused or because the realm did not converge. It carries
 * the failed step and the receipt of every step that completed, so a caller can
 * resume from that step rather than repeating the whole provision.
 */
final class RealmProvisionException extends \RuntimeException
{
    public function __construct(
        public readonly RealmProvisionStep $failedStep,
        public readonly RealmProvisionReceipt $receipt,
        ?\Throwable $previous = null,
    ) {
        parent::__construct("custd: realm provision failed at step {$failedStep->value}", 0, $previous);
    }
}
