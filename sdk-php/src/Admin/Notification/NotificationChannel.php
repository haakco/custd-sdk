<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

/**
 * NotificationChannel names the values of TenantDestination.channel, TenantDestinationRequest.channel.
 * A value Custd adds later still decodes as a plain string.
 */
final class NotificationChannel
{
    public const EMAIL = 'email';
    public const WEBHOOK = 'webhook';
    public const SLACK = 'slack';
}
