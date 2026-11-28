<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageMediaRef
{
    public function __construct(
        public string $messageUuid,
        public string $mediaUuid,
    ) {
    }
}
