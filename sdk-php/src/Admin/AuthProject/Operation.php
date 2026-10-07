<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Operation is the receipt an apply returns.
 *
 * `replayed` reports that the same body and Idempotency-Key returned the
 * original operation.
 */
final readonly class Operation
{
    public function __construct(
        public string $id = '',
        public string $kind = '',
        public string $status = '',
        public int $revision = 0,
        public string $idempotencyKey = '',
        public string $appliedAt = '',
        public bool $replayed = false,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, "auth-project operation");

        return new self(
            Fields::string($object, "id"),
            Fields::string($object, "kind"),
            Fields::string($object, "status"),
            Fields::integer($object, "revision"),
            Fields::string($object, "idempotencyKey"),
            Fields::string($object, "appliedAt"),
            Fields::boolean($object, "replayed"),
        );
    }
}
