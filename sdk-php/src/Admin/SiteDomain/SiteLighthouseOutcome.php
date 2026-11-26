<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteLighthouseOutcome names the values of LighthouseRun.outcome.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteLighthouseOutcome
{
    public const SUCCESS = 'success';
    public const FAILED = 'failed';
}
