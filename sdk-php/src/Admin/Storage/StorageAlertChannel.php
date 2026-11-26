<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

/**
 * StorageAlertChannel names the values of StorageAlertEvent.channel, StorageAlertRule.channel,
 * StorageAlertRuleCreateRequest.channel.
 * A value Custd adds later still decodes as a plain string.
 */
final class StorageAlertChannel
{
    public const EMAIL = 'email';
    public const WEBHOOK = 'webhook';
}
