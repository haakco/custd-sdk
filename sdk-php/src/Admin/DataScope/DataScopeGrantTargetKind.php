<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * DataScopeGrantTargetKind names the values of GrantTarget.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataScopeGrantTargetKind
{
    public const PARENT = 'parent';
    public const SUB_CLIENT = 'sub_client';
    public const RESOURCE = 'resource';
}
