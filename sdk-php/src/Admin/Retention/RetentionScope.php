<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

/**
 * RetentionScope names the values of RetentionPolicy.scope, RetentionPolicyUpsertRequest.scope.
 * A value Custd adds later still decodes as a plain string.
 */
final class RetentionScope
{
    public const TENANT = 'tenant';
    public const DATA_SPACE = 'data_space';
    public const EVENT_TYPE = 'event_type';
    public const GLOBAL = 'global';
}
