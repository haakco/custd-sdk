<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

/**
 * TenantPurpose names the values of Tenant.purpose, TenantCreateRequest.purpose.
 * A value Custd adds later still decodes as a plain string.
 */
final class TenantPurpose
{
    public const CUSTOMER = 'customer';
    public const GENERATED_PROOF = 'generated_proof';
}
