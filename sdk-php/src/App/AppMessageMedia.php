<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageMedia
{
    public function __construct(
        public string $contentType,
        public string $image,
    ) {
    }
}
