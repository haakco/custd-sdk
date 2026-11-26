<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * PreparedDataState names the values of OutputStatus.processingState, ReceiptStatus.processingState.
 * A value Custd adds later still decodes as a plain string.
 */
final class PreparedDataState
{
    public const ACCEPTED = 'accepted';
    public const PROCESSING = 'processing';
    public const READY = 'ready';
    public const FAILED = 'failed';
}
