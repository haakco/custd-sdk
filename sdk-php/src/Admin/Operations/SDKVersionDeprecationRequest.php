<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

final readonly class SDKVersionDeprecationRequest
{
    public function __construct(
        public string $note,
        public string $recommendedVersion,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'note' => $this->note,
            'recommendedVersion' => $this->recommendedVersion,
        ];

        return $body;
    }
}
