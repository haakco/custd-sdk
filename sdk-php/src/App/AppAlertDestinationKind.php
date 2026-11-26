<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppAlertDestinationKind names the values of AppItemAlertWebhook.kind.
 * webhook posts signed Custd JSON; slack posts a Slack message.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppAlertDestinationKind
{
    public const WEBHOOK = 'webhook';
    public const SLACK = 'slack';
}
