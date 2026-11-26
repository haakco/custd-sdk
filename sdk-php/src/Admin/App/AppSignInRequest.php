<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

final readonly class AppSignInRequest
{
    public function __construct(
        public int $expectedRevision,
        public string $mode,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'expectedRevision' => $this->expectedRevision,
            'mode' => $this->mode,
        ];

        return $body;
    }
}
