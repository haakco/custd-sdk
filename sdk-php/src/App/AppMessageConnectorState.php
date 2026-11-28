<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

enum AppMessageConnectorState: string
{
    case Active = 'active';
    case Paused = 'paused';
    case Stale = 'stale';
    case Disconnected = 'disconnected';
}
