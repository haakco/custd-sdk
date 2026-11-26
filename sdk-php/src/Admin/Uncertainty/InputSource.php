<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class InputSource
{
    public function __construct(
        public string $field,
        public string $kind,
        public string $projectUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'field'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'projectUuid'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'field' => $this->field,
            'kind' => $this->kind,
            'projectUuid' => $this->projectUuid,
        ];

        return $body;
    }
}
