<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

/**
 * ClientOperationState names the values of OperationStatus.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class ClientOperationState
{
    public const PENDING = 'pending';
    public const SUCCESS = 'success';
    public const FAILURE = 'failure';
    public const UNKNOWN = 'unknown';
}
