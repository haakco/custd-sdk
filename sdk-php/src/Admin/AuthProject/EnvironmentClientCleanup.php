<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * EnvironmentClientCleanup reports the provider half of one offboard. `status` is
 * one of complete, pending or unavailable; `clientsRemoved` counts the owned
 * registrations this run deleted; `errorCategory` is the bounded reason a pending
 * run did not finish.
 */
final readonly class EnvironmentClientCleanup
{
    public function __construct(
        public string $status = '',
        public int $clientsRemoved = 0,
        public string $errorCategory = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project environment client cleanup');

        return new self(
            Fields::string($object, 'status'),
            Fields::integer($object, 'clientsRemoved'),
            Fields::optionalString($object, 'errorCategory') ?? '',
        );
    }
}
