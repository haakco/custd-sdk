<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ApplicationIdentityTraitsStatus names the values of ApplicationPrincipalIdentityExport.traitsStatus.
 * A value Custd adds later still decodes as a plain string.
 */
final class ApplicationIdentityTraitsStatus
{
    public const INCLUDED = 'included';
    public const INCOMPLETE = 'incomplete';
    public const IDENTITY_ABSENT = 'identity_absent';
    public const DIRECTORY_UNAVAILABLE = 'directory_unavailable';
    public const PROVIDER_UNREADABLE = 'provider_unreadable';
}
