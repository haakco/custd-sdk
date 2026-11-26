<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

/**
 * RlsExecuteOutcome names the values of RLSExecuteResponse.outcome.
 * A value Custd adds later still decodes as a plain string.
 */
final class RlsExecuteOutcome
{
    public const ATTEMPTED = 'attempted';
    public const SUCCESS = 'success';
    public const FAILURE = 'failure';
}
