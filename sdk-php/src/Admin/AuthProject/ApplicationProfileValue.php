<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** ApplicationProfileValue is one field value a caller asks to store. */
final readonly class ApplicationProfileValue
{
    public function __construct(public string $fieldKey, public string $value)
    {
        if (trim($fieldKey) === '' || trim($value) === '') {
            throw new \InvalidArgumentException('custd: application profile value needs a field key and value');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['fieldKey' => $this->fieldKey, 'value' => $this->value];
    }
}
