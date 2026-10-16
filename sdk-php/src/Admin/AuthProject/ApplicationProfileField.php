<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ApplicationProfileField is one field of a principal's profile as the policy
 * discloses it. `editable` reports whether this administrator surface may write
 * the field; a provider-owned field is disclosed but not writable here.
 */
final readonly class ApplicationProfileField
{
    public function __construct(
        public string $fieldKey = '',
        public string $value = '',
        public bool $present = false,
        public bool $required = false,
        public string $editableBy = '',
        public bool $editable = false,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application profile field');

        return new self(
            Fields::string($object, 'fieldKey'),
            Fields::optionalString($object, 'value') ?? '',
            Fields::boolean($object, 'present'),
            Fields::boolean($object, 'required'),
            Fields::string($object, 'editableBy'),
            Fields::boolean($object, 'editable'),
        );
    }
}
