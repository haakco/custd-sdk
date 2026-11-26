<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteProbeProtocol names the values of SiteProbe.protocol.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteProbeProtocol
{
    public const HTTP1_1 = 'http1.1';
    public const HTTP2 = 'http2';
}
