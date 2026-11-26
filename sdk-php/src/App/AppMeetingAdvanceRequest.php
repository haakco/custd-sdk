<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMeetingAdvanceRequest
{
    public function __construct(
        public string $blockUuid,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'blockUuid' => $this->blockUuid,
        ];

        return $body;
    }
}
