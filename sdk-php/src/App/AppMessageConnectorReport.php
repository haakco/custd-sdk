<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageConnectorReport
{
    public function __construct(
        public AppMessageConnectorConnection $connectionState,
        public int $pendingMedia,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'connectionState' => $this->connectionState->value,
            'pendingMedia' => $this->pendingMedia,
        ];
    }
}
