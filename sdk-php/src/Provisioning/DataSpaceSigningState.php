<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** DataSpaceSigningState is whether a data space still accepts signed events. */
final class DataSpaceSigningState
{
    public const ACTIVE = 'active';
    public const REVOKED = 'revoked';
    public const ERASED = 'erased';
}
