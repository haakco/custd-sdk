<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ProfileField is one profile field's policy inside the environment's desired
 * state.
 */
final readonly class ProfileField
{
    public function __construct(
        public string $key,
        public bool $required,
        public bool $visibleToApplication,
        public string $editableBy,
    ) {
        if (trim($key) === "") {
            throw new \InvalidArgumentException("custd: profile field key is required");
        }
        if (trim($editableBy) === "") {
            throw new \InvalidArgumentException("custd: profile field editableBy is required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "key" => $this->key,
            "required" => $this->required,
            "visibleToApplication" => $this->visibleToApplication,
            "editableBy" => $this->editableBy,
        ];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, "key"),
            Fields::boolean($payload, "required"),
            Fields::boolean($payload, "visibleToApplication"),
            Fields::string($payload, "editableBy"),
        );
    }
}
