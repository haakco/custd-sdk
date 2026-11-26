<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectDirectoryState names the values of DirectoryView.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectDirectoryState
{
    public const DRAFT = 'draft';
    public const PROVISIONING = 'provisioning';
    public const READY = 'ready';
    public const PAUSED = 'paused';
    public const FAILED = 'failed';
    public const RELEASED = 'released';
}
