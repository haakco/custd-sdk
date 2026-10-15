<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * DirectoryCapacity is the deployment's declared credential-store pool. The pool
 * is deployment-wide, so every environment's report carries the same numbers.
 */
final readonly class DirectoryCapacity
{
    public function __construct(
        public int $declared = 0,
        public int $inUse = 0,
        public int $free = 0,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project directory capacity');

        return new self(
            Fields::integer($object, 'declared'),
            Fields::integer($object, 'inUse'),
            Fields::integer($object, 'free'),
        );
    }
}
