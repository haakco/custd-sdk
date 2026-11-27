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
 * until registration has run. `companyUuid` is the persisted company this
 * environment's project belongs to; null means explicitly unbound, and a
 * consumer must not treat it as verified ownership unless the provider
 * authorised the read. `companySlug` is the owning company's slug, null while there is none;
 * `brandLogoUrl` is the realm's uploaded logo address, null while it has none; `hosting` is the
 * derived serving identity of a hosted environment, null when it is not served.
 */
final readonly class Status
{
    /** @param list<string>|null $recommendations Non-failing configuration guidance. */
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
        public ?string $companyUuid = null,
        public ?string $companySlug = null,
        public ?string $brandLogoUrl = null,
        public ?HostingStatus $hosting = null,
        public ?array $recommendations = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, "auth-project status");
        $clientSync = Fields::optionalObject($object, "clientSync");
        $hosting = Fields::optionalObject($object, 'hosting');

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
            Fields::optionalString($object, 'companyUuid'),
            Fields::optionalString($object, 'companySlug'),
            Fields::optionalString($object, 'brandLogoUrl'),
            $hosting === null ? null : HostingStatus::fromPayload($hosting),
            Fields::optionalStrings($object, "recommendations"),
        );
    }
}
