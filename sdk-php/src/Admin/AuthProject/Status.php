<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Status is the environment's configured state and its applied revision.
 *
 * `desired->audiences` is the audience binding the caller applied and
 * `environmentId` is the environment binding, so the
 * project/environment/audience mapping the contract requires is readable here
 * after an apply. `reconciled` describes the configuration and `loginReady`
 * describes execution; neither is inferred from the other. `clientSync` is null
 * until registration has run.
 */
final readonly class Status
{
    public function __construct(
        public DesiredState $desired,
        public string $projectId = '',
        public string $environmentId = '',
        public int $revision = 0,
        public bool $reconciled = false,
        public string $reconcileNote = '',
        public bool $loginReady = false,
        public string $loginNote = '',
        public ?ClientSyncStatus $clientSync = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, "auth-project status");
        $clientSync = Fields::optionalObject($object, "clientSync");

        return new self(
            DesiredState::fromPayload(Fields::object($object, "desired")),
            Fields::string($object, "projectId"),
            Fields::string($object, "environmentId"),
            Fields::integer($object, "revision"),
            Fields::boolean($object, "reconciled"),
            Fields::string($object, "reconcileNote"),
            Fields::boolean($object, "loginReady"),
            Fields::string($object, "loginNote"),
            $clientSync === null ? null : ClientSyncStatus::fromPayload($clientSync),
        );
    }
}
