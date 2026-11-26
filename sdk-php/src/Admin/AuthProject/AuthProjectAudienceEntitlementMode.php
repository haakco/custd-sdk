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
    public const ORGANISATION_MEMBERSHIP = 'organisation_membership';
    public const EXPLICIT_GRANTS = 'explicit_grants';
}
