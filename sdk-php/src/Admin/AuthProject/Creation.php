<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Creation is the response to creating a project.
 *
 * `replayed` reports that the same body and Idempotency-Key returned the
 * original operation; `runtimeReady` reports that the environment is serving,
 * not that application login is enabled.
 */
final readonly class Creation
{
    public function __construct(
        public Summary $project,
        public string $operationId = '',
        public bool $replayed = false,
        public bool $runtimeReady = false,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project creation');

        return new self(
            Summary::fromPayload(Fields::object($object, 'project')),
            Fields::string($object, 'operationId'),
            Fields::boolean($object, 'replayed'),
            Fields::boolean($object, 'runtimeReady'),
        );
    }
}
