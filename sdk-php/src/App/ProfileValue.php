<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class ProfileValue
{
    public function __construct(
        public string $fieldKey,
        public string $value,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'fieldKey' => $this->fieldKey,
            'value' => $this->value,
        ];

        return $body;
    }
}
