<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

final readonly class CaptureResult
{
    public function __construct(public CaptureOutcome $outcome, public ?int $status = null)
    {
    }
}
