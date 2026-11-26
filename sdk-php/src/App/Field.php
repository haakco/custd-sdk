<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class Field
{
    public function __construct(
        public bool $editable,
        public string $editableBy,
        public string $fieldKey,
        public bool $initialized,
        public bool $present,
        public bool $required,
        public ?string $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'editable'),
            Fields::string($payload, 'editableBy'),
            Fields::string($payload, 'fieldKey'),
            Fields::boolean($payload, 'initialized'),
            Fields::boolean($payload, 'present'),
            Fields::boolean($payload, 'required'),
            Fields::optionalString($payload, 'value'),
        );
    }
}
