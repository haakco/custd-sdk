<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

/**
 * OffboardingState names the values of OffboardingRequestResponse.state, TenantOffboardingReceipt.final_state.
 * A value Custd adds later still decodes as a plain string.
 */
final class OffboardingState
{
    public const PREVIEW = 'preview';
    public const REQUESTED = 'requested';
    public const EXPORTING = 'exporting';
    public const EXPORTED = 'exported';
    public const CONFIRMING = 'confirming';
    public const CONFIRMED = 'confirmed';
    public const WAIVER_REQUESTED = 'waiver_requested';
    public const WAIVER_APPROVED = 'waiver_approved';
    public const FENCING = 'fencing';
    public const REVOKING = 'revoking';
    public const DELETING = 'deleting';
    public const COMPLETE = 'complete';
    public const FAILED = 'failed';
    public const CANCELLED = 'cancelled';
}
