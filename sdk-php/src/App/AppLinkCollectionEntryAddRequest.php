<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppLinkCollectionEntryAddRequest
{
    public function __construct(
        public string $token,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'token' => $this->token,
        ];

        return $body;
    }
}
