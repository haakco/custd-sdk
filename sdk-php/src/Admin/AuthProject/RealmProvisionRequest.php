<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * RealmProvisionRequest is one environment's realm setup: the desired state to
 * apply and the directory credential store to enable. The owning-user option and
 * the base idempotency key come from RequestOptions.
 *
 * It carries no directory revision: the directory enable must name the revision
 * the apply produced, which the helper derives rather than trusting a caller to
 * read.
 */
final readonly class RealmProvisionRequest
{
    public function __construct(
        public DesiredStateRequest $desiredStateRequest,
        public string $directoryPoolId,
    ) {
        if (trim($directoryPoolId) === '') {
            throw new \InvalidArgumentException('custd: realm provision needs a directory poolId');
        }
    }
}
