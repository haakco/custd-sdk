<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteBrowserCollectorMode names the values of BrowserCollector.mode, BrowserCollectorRequest.mode.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteBrowserCollectorMode
{
    public const ENABLED = 'enabled';
    public const DISABLED = 'disabled';
}
