<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

enum AppMessageConnectorAction: string
{
    case Pause = 'pause';
    case Resume = 'resume';
    case Disconnect = 'disconnect';
}
