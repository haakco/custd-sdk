<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

/**
 * MachineAccessArea names the feature areas a machine credential can be allowed or blocked from. The set is
 * open: a newer server may send an area this release does not name.
 */
final class MachineAccessArea
{
    public const SITES = 'sites';
    public const REPORTING = 'reporting';
    public const PRIVACY_ERASURE = 'privacy_erasure';
    public const DESTRUCTIVE_JOBS = 'destructive_jobs';
    public const USERS_ACCESS = 'users_access';
    public const PROVISIONING_CREDENTIALS = 'provisioning_credentials';
    public const INGEST_SCHEMAS = 'ingest_schemas';
    public const USAGE_BILLING = 'usage_billing';
}
