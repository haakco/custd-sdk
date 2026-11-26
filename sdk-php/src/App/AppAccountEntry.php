<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppAccountEntry is for a same-tab form POST to the action URL. The ticket is a short-lived, one-use
 * credential and must stay out of URLs and logs.
 */
final readonly class AppAccountEntry
{
    public function __construct(
        public string $actionUrl,
        #[\SensitiveParameter]
        public string $ticket,
    ) {
    }

    /** @return array{actionUrl: string, ticket: string} */
    public function __debugInfo(): array
    {
        return ['actionUrl' => $this->actionUrl, 'ticket' => '<redacted>'];
    }
}
