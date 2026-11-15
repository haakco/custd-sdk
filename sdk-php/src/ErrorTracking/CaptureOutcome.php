<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

enum CaptureOutcome: string
{
    case Accepted = 'accepted';
    case Unavailable = 'unavailable';
    case Rejected = 'rejected';
    case Limited = 'limited';
}
