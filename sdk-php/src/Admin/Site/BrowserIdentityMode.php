<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Site;

/**
 * BrowserIdentityMode names the values of Site.identityMode, SiteConfigResponse.identityMode,
 * SiteCreateResponse.identityMode, SiteUpdateRequest.identityMode.
 * A value Custd adds later still decodes as a plain string.
 */
final class BrowserIdentityMode
{
    public const COOKIELESS = 'cookieless';
    public const EXTENDED = 'extended';
}
