<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * Retryability names the values of BootstrapStatus.retryability, OutputStatus.retryability,
 * ReceiptStatus.retryability, ReportingTrust.retryability.
 * A value Custd adds later still decodes as a plain string.
 */
final class Retryability
{
    public const NONE = 'none';
    public const BOUNDED = 'bounded';
}
