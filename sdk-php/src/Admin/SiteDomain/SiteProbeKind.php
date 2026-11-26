<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteProbeKind names the values of SiteProbe.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteProbeKind
{
    public const PING = 'ping';
    public const TCP = 'tcp';
    public const DNS = 'dns';
    public const HTTP_DELIVERY = 'http-delivery';
}
