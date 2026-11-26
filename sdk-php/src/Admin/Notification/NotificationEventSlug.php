<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Notification;

/**
 * NotificationEventSlug names the values of TenantDestination.eventSlug.
 * A value Custd adds later still decodes as a plain string.
 */
final class NotificationEventSlug
{
    public const EMAIL_RELAY_TEST_SEND = 'email_relay_test_send';
    public const IDENTITY_VERIFY_EMAIL = 'identity_verify_email';
    public const IDENTITY_RESET_PASSWORD = 'identity_reset_password';
    public const USER_WELCOME = 'user_welcome';
    public const APPLICATION_INVITATION = 'application_invitation';
    public const ERROR_ISSUE_ALERT = 'error_issue_alert';
    public const SITE_FINDING_OPENED = 'site_finding_opened';
    public const SITE_INCIDENT = 'site_incident';
    public const SITE_AI_ALLOWANCE = 'site_ai_allowance';
    public const SITE_STATUS_PAGE_CONFIRM = 'site_status_page_confirm';
    public const SITE_STATUS_PAGE_UPDATE = 'site_status_page_update';
}
