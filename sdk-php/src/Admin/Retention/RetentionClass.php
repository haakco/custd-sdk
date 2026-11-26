<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

/**
 * RetentionClass names the values of RetentionPolicy.retentionClass, RetentionPolicyUpsertRequest.retentionClass.
 * A value Custd adds later still decodes as a plain string.
 */
final class RetentionClass
{
    public const RAW = 'raw';
    public const ARCHIVE = 'archive';
    public const MATERIALIZED = 'materialized';
    public const CACHE = 'cache';
    public const OBJECT = 'object';
    public const AUDIT_EVENT = 'audit_event';
    public const AUDIT_IP_ADDRESS = 'audit_ip_address';
    public const AUDIT_USER_AGENT = 'audit_user_agent';
}
