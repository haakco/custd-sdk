<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

final readonly class DataLabelValueCreateRequest
{
    public function __construct(
        public string $description,
        public string $displayName,
        public string $value,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'description' => $this->description,
            'displayName' => $this->displayName,
            'value' => $this->value,
        ];

        return $body;
    }
}
