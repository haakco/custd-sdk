<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

final readonly class IngestClaimTerminalRequest
{
    public function __construct(
        public string $failureClass,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'failureClass' => $this->failureClass,
        ];

        return $body;
    }
}
