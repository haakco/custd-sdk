<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * DataScopeStatus names the values of DataScope.status, DataScopeResource.status,
 * DataScopeResourceUpdateRequest.status, DataScopeUpdateRequest.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataScopeStatus
{
    public const ACTIVE = 'active';
    public const DISABLED = 'disabled';
}
