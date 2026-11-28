<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageMediaUpload
{
    public function __construct(
        public string $messageUuid,
        public string $image,
    ) {
    }
}
