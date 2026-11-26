<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

/**
 * EmailDeliveryOutcome names the values of EmailDeliveryRecipient.outcome.
 * A value Custd adds later still decodes as a plain string.
 */
final class EmailDeliveryOutcome
{
    public const DEFERRED = 'deferred';
    public const REMOTE_ACCEPTED = 'remote_accepted';
    public const TERMINAL_FAILURE = 'terminal_failure';
}
