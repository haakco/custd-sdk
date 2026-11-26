<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

/**
 * AuditDisclosureState names the values of AuditNetworkDisclosure.ipAddressState,
 * AuditNetworkDisclosure.userAgentState.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuditDisclosureState
{
    public const AVAILABLE = 'available';
    public const REDACTED = 'redacted';
    public const NOT_RECORDED = 'not_recorded';
}
