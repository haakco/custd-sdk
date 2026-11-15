<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

final readonly class CaptureRequest
{
    public function __construct(
        public \Throwable $error,
        public CaptureMode $mode = CaptureMode::Handled,
        public ?string $correlationId = null,
    ) {
    }
}
