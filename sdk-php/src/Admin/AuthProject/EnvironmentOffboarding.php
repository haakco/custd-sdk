<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * EnvironmentOffboarding is the receipt for one offboarded environment. It names
 * both the project and the one environment it withdrew, so a caller can tell it
 * from a physical delete without reading the request back. `hosting` is what it withdrew from
 * the environment's hosted application.
 */
final readonly class EnvironmentOffboarding
{
    public function __construct(
        public EnvironmentClientCleanup $clientCleanup,
        public EnvironmentRetainedResources $retained,
        public HostingWithdrawal $hosting,
        public string $projectId = '',
        public string $projectSlug = '',
        public string $environmentId = '',
        public string $slug = '',
        public string $name = '',
        public bool $authorityWithdrawn = false,
        public bool $loginPaused = false,
        public int $revision = 0,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project environment offboarding');

        return new self(
            EnvironmentClientCleanup::fromPayload(Fields::object($object, 'clientCleanup')),
            EnvironmentRetainedResources::fromPayload(Fields::object($object, 'retained')),
            HostingWithdrawal::fromPayload(Fields::object($object, 'hosting')),
            Fields::string($object, 'projectId'),
            Fields::string($object, 'projectSlug'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'slug'),
            Fields::string($object, 'name'),
            Fields::boolean($object, 'authorityWithdrawn'),
            Fields::boolean($object, 'loginPaused'),
            Fields::integer($object, 'revision'),
        );
    }
}
