<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

final readonly class ApplicationPrincipalProfileValueView
{
    public function __construct(
        public string $fieldKey,
        public string $value,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal export row');

        return new self(
            Fields::string($object, 'fieldKey'),
            Fields::string($object, 'value'),
        );
    }
}
