<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

enum CaptureMode: string
{
    case Handled = 'handled';
    case Unhandled = 'unhandled';
}
