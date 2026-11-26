<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** DataSpaceErasureStatus is where a data space erasure is in its life. */
enum DataSpaceErasureStatus: string
{
    case Requested = 'requested';
    case Erasing = 'erasing';
    case Completed = 'completed';
    case Failed = 'failed';
}
