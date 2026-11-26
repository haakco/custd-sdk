<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

/**
 * NotificationDestinationEvent names the events a tenant can route to a destination.
 * A value Custd adds later still decodes as a plain string.
 */
final class NotificationDestinationEvent
{
    public const ERROR_ISSUE_ALERT = 'error_issue_alert';
    public const SITE_FINDING_OPENED = 'site_finding_opened';
    public const SITE_INCIDENT = 'site_incident';
    public const SITE_AI_ALLOWANCE = 'site_ai_allowance';
}
