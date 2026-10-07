<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Preview is the field-level change set an apply would write. A preview writes
 * nothing.
 */
final readonly class Preview
{
    /**
     * @param list<Change>|null $changes
     * @param list<string>|null $sideEffects
     */
    public function __construct(
        public string $projectId = '',
        public string $environmentId = '',
        public int $revision = 0,
        public ?array $changes = null,
        public ?array $sideEffects = null,
        public bool $noOp = false,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, "auth-project preview");
        $changes = Fields::optionalObjects($object, "changes");

        return new self(
            Fields::string($object, "projectId"),
            Fields::string($object, "environmentId"),
            Fields::integer($object, "revision"),
            $changes === null ? null : array_map(Change::fromPayload(...), $changes),
            Fields::optionalStrings($object, "sideEffects"),
            Fields::boolean($object, "noOp"),
        );
    }
}
