<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppAlertDeliveryOutcome names the values of AppItemAlertDelivery.outcome.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppAlertDeliveryOutcome
{
    public const PENDING = 'pending';
    public const SENT = 'sent';
    public const FAILED = 'failed';
}
