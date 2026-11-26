<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class CurrentApplicationProfile
{
    /**
     * @param list<Field> $fields
     */
    public function __construct(
        public array $fields,
        public ?bool $managedPhoto = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Field::fromPayload(...), Fields::objects($payload, 'fields')),
            Fields::optionalBoolean($payload, 'managedPhoto'),
        );
    }
}
