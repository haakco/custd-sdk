<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppAlertChannel names the values of AppItemAlertDelivery.channel.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppAlertChannel
{
    public const WEBHOOK = 'webhook';
    public const SLACK = 'slack';
    public const EMAIL = 'email';
}
