<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

final readonly class CopyModelRequest
{
    public function __construct(
        public ?string $name = null,
        public ?int $versionNumber = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->name !== null) {
            $body['name'] = $this->name;
        }
        if ($this->versionNumber !== null) {
            $body['versionNumber'] = $this->versionNumber;
        }

        return $body;
    }
}
