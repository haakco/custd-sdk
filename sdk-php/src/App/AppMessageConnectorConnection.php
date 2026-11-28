<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

enum AppMessageConnectorConnection: string
{
    case Connecting = 'connecting';
    case ImportingHistory = 'importing_history';
    case Syncing = 'syncing';
    case Offline = 'offline';
    case PairAgain = 'pair_again';
}
