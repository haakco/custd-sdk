<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

/**
 * ClientBootstrapState names the values of BootstrapStatus.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class ClientBootstrapState
{
    public const READY = 'ready';
    public const ATTENTION_REQUIRED = 'attention_required';
    public const SUSPENDED = 'suspended';
}
