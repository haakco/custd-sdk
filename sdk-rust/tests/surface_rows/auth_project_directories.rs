use custd_sdk::{
    ApplicationMembershipContext, ApplicationMembershipRevocation,
    ApplicationMembershipRevokeRequest, ApplicationPrincipalErasure,
    ApplicationPrincipalErasureRequest, ApplicationPrincipalExport,
    ApplicationPrincipalListResponse, ApplicationPrincipalProfile, ApplicationPrincipalSuspension,
    ApplicationProfileValuesRequest, ApplicationSessionInventory, ApplicationSessionRevocation,
    ApplicationSessionRevokeRequest, ApplicationSessionsRevokeAllRequest, AuthDirectoryAction,
    AuthProjectAudienceGrant, AuthProjectAudienceGrantRequest, AuthProjectDirectoryRequest,
    AuthProjectDirectoryStatus, AuthProjectEnvironmentOrganisationList,
    AuthProjectInvitationIssueRequest, AuthProjectInvitationIssued,
    AuthProjectInvitationListResponse, AuthProjectInvitationRedeliveryRequest,
    AuthProjectInvitationRevocationRequest, AuthProjectInvitationView, AuthProjectOperation,
    AuthProjectPrincipalAudiences,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories",
            |c| drop(c.custd.list_auth_directories("p-1", "e-1")),
            round_trip::<AuthProjectDirectoryStatus>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{action}",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/enable",
            |c| {
                drop(c.custd.act_on_auth_directory(
                    "p-1",
                    "e-1",
                    AuthDirectoryAction::Enable,
                    &body::<AuthProjectDirectoryRequest>(r#"{"expectedRevision":1,"poolId":"x"}"#),
                    "key-0001",
                ))
            },
            round_trip::<AuthProjectOperation>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/principals?limit=7&cursor=c-1",
            |c| {
                drop(
                    c.custd
                        .list_application_principals("p-1", "e-1", Some(7), Some("c-1")),
                )
            },
            round_trip::<ApplicationPrincipalListResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/export",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/export",
            |c| {
                drop(
                    c.custd
                        .export_application_principal("p-1", "e-1", "d-1", "p-1"),
                )
            },
            round_trip::<ApplicationPrincipalExport>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/erase",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/erase",
            |c| {
                drop(c.custd.erase_application_principal(
                    "p-1",
                    "e-1",
                    "d-1",
                    "p-1",
                    &body::<ApplicationPrincipalErasureRequest>(r#"{"confirm":true}"#),
                    "key-0001",
                ))
            },
            round_trip::<ApplicationPrincipalErasure>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/suspend",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/suspend",
            |c| {
                drop(
                    c.custd
                        .suspend_application_principal("p-1", "e-1", "d-1", "p-1", "key-0001"),
                )
            },
            round_trip::<ApplicationPrincipalSuspension>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/restore",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/restore",
            |c| {
                drop(
                    c.custd
                        .restore_application_principal("p-1", "e-1", "d-1", "p-1", "key-0001"),
                )
            },
            round_trip::<ApplicationPrincipalSuspension>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/profile",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/profile",
            |c| {
                drop(
                    c.custd
                        .get_application_principal_profile("p-1", "e-1", "d-1", "p-1"),
                )
            },
            round_trip::<ApplicationPrincipalProfile>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/profile",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/profile",
            |c| {
                drop(c.custd.set_application_principal_profile(
                    "p-1",
                    "e-1",
                    "d-1",
                    "p-1",
                    &body::<ApplicationProfileValuesRequest>(r#"{"values":[]}"#),
                    "key-0001",
                ))
            },
            round_trip::<ApplicationPrincipalProfile>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/sessions",
            |c| {
                drop(
                    c.custd
                        .list_application_principal_sessions("p-1", "e-1", "d-1", "p-1"),
                )
            },
            round_trip::<ApplicationSessionInventory>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions/revoke",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/sessions/revoke",
            |c| {
                drop(c.custd.revoke_application_principal_session(
                    "p-1",
                    "e-1",
                    "d-1",
                    "p-1",
                    &body::<ApplicationSessionRevokeRequest>(r#"{"sessionId":"x"}"#),
                    "key-0001",
                ))
            },
            round_trip::<ApplicationSessionRevocation>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions/revoke-all",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/sessions/revoke-all",
            |c| {
                drop(c.custd.revoke_application_principal_sessions(
                    "p-1",
                    "e-1",
                    "d-1",
                    "p-1",
                    &body::<ApplicationSessionsRevokeAllRequest>(r#"{"confirm":true}"#),
                    "key-0001",
                ))
            },
            round_trip::<ApplicationSessionRevocation>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/memberships",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/memberships",
            |c| {
                drop(
                    c.custd
                        .list_application_principal_memberships("p-1", "e-1", "d-1", "p-1"),
                )
            },
            round_trip::<ApplicationMembershipContext>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/memberships/revoke",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/d-1/principals/p-1/memberships/revoke",
            |c| {
                drop(c.custd.revoke_application_principal_membership(
                    "p-1",
                    "e-1",
                    "d-1",
                    "p-1",
                    &body::<ApplicationMembershipRevokeRequest>(r#"{"organisationId":"x"}"#),
                ))
            },
            round_trip::<ApplicationMembershipRevocation>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/principals/p-1/audiences?directoryId=d-1",
            |c| drop(c.custd.list_principal_audiences("p-1", "e-1", "p-1", "d-1")),
            round_trip::<AuthProjectPrincipalAudiences>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences/grant",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/principals/p-1/audiences/grant",
            |c| {
                drop(c.custd.grant_principal_audience(
                    "p-1",
                    "e-1",
                    "p-1",
                    &body::<AuthProjectAudienceGrantRequest>(
                        r#"{"audience":"x","directoryId":"x","organisationId":"x"}"#,
                    ),
                    "key-0001",
                ))
            },
            round_trip::<AuthProjectAudienceGrant>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences/revoke",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/principals/p-1/audiences/revoke",
            |c| {
                drop(c.custd.revoke_principal_audience(
                    "p-1",
                    "e-1",
                    "p-1",
                    &body::<AuthProjectAudienceGrantRequest>(
                        r#"{"audience":"x","directoryId":"x","organisationId":"x"}"#,
                    ),
                    "key-0001",
                ))
            },
            round_trip::<AuthProjectAudienceGrant>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/organisations",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/organisations",
            |c| drop(c.custd.list_auth_environment_organisations("p-1", "e-1")),
            round_trip::<AuthProjectEnvironmentOrganisationList>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/invitations",
            |c| drop(c.custd.list_auth_invitations("p-1", "e-1")),
            round_trip::<AuthProjectInvitationListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/invitations",
            |c| {
                drop(c.custd.issue_auth_project_invitation("p-1", "e-1", &body::<AuthProjectInvitationIssueRequest>(r#"{"email":"x","expiresInSeconds":1,"membershipRole":"x","organisationId":"x","poolId":"x"}"#), "key-0001"))
            },
            round_trip::<AuthProjectInvitationIssued>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/redeliver",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/invitations/redeliver",
            |c| {
                drop(c.custd.redeliver_auth_project_invitation(
                    "p-1",
                    "e-1",
                    &body::<AuthProjectInvitationRedeliveryRequest>(r#"{"invitationId":"x"}"#),
                    "key-0001",
                ))
            },
            round_trip::<AuthProjectInvitationIssued>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/revoke",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/invitations/revoke",
            |c| {
                drop(c.custd.revoke_auth_project_invitation(
                    "p-1",
                    "e-1",
                    &body::<AuthProjectInvitationRevocationRequest>(r#"{"invitationId":"x"}"#),
                    "key-0001",
                ))
            },
            round_trip::<AuthProjectInvitationView>,
        ),
    ]
}
