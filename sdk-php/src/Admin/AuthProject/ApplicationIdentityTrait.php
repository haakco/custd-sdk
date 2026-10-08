<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** One public trait whose native JSON type is retained, including object/list distinction. */
final readonly class ApplicationIdentityTrait
{
    /** @param list<mixed>|\stdClass|string|int|float|bool|null $value */
    public function __construct(
        public string $name,
        public \stdClass|array|string|int|float|bool|null $value,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application identity trait');
        $fields = get_object_vars($object);
        if (!array_key_exists('value', $fields)) {
            throw new \UnexpectedValueException('custd: identity trait value is required');
        }
        $value = $fields['value'];
        if ($value !== null && !is_scalar($value) && !is_array($value) && !$value instanceof \stdClass) {
            throw new \UnexpectedValueException('custd: identity trait value must be JSON');
        }
        if (is_array($value) && !array_is_list($value)) {
            throw new \UnexpectedValueException('custd: JSON objects must retain their object shape');
        }

        return new self(Fields::string($object, 'name'), $value);
    }
}
