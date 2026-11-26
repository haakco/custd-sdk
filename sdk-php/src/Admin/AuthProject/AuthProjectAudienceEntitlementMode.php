<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectAudienceEntitlementMode names the values of AuthProjectCreateRequest.audienceEntitlementMode,
 * AuthProjectEnvironmentCreateRequest.audienceEntitlementMode, AuthProjectSummary.audienceEntitlementMode,
 * PrincipalAudiences.audienceEntitlementMode.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectAudienceEntitlementMode
{
    /**
     * Organisation membership admits any live member of the environment's organisation for every
     * registered audience: the behaviour every environment had before explicit grants existed.
     */
    public const ORGANISATION_MEMBERSHIP = 'organisation_membership';
    /** An audience is admitted only when the principal holds a grant for that exact audience. */
    public const EXPLICIT_GRANTS = 'explicit_grants';
}
