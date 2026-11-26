<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

/**
 * NotificationWebhookKind names the values of NotificationWebhookCreateRequest.kind,
 * NotificationWebhookSecret.kind, NotificationWebhookSubscription.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class NotificationWebhookKind
{
    public const WEBHOOK = 'webhook';
    public const SLACK = 'slack';
}
