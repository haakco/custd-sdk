<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * RequestOptions carries what every project-auth control-plane call needs beyond
 * its typed request body.
 *
 * `owningUserUuid` is sent as X-Custd-Owning-User-UUID. A machine credential
 * must name the platform user it acts for or Custd refuses the call; a human
 * administrator's own token subject is the actor and leaves it unset.
 *
 * `idempotencyKey` is sent as Idempotency-Key on the operations Custd makes
 * retry-safe (create project, revoke one session, revoke all sessions); those
 * operations reject a blank key before a request is sent.
 */
final readonly class RequestOptions
{
    public function __construct(
        public ?string $owningUserUuid = null,
        public ?string $idempotencyKey = null,
    ) {
    }
}
