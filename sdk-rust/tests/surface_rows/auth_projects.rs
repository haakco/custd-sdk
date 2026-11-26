use custd_sdk::{
    AppItemEnvironmentLinkList, AuthProjectCapability, AuthProjectClientSyncReport,
    AuthProjectClientSyncRequest, AuthProjectCompanyBinding, AuthProjectCreateRequest,
    AuthProjectCreation, AuthProjectDeletion, AuthProjectDeletionRequest,
    AuthProjectDesiredStateRequest, AuthProjectEnvironmentCreateRequest,
    AuthProjectEnvironmentDeletion, AuthProjectEnvironmentDeletionRequest,
    AuthProjectEnvironmentOffboardRequest, AuthProjectEnvironmentOffboarding,
    AuthProjectListResponse, AuthProjectOperation, AuthProjectPreview, AuthProjectStatus,
    AuthProjectSummary,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/auth-projects",
            "/api/v1/admin/auth-projects?after=a-1",
            |c| drop(c.custd.list_auth_projects(Some("a-1"))),
            round_trip::<AuthProjectListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects",
            "/api/v1/admin/auth-projects",
            |c| {
                drop(c.custd.create_auth_project(&body::<AuthProjectCreateRequest>(r#"{"audienceEntitlementMode":"organisation_membership","environmentSlug":"x","identityMode":"isolated","name":"x","slug":"x"}"#), "key-0001"))
            },
            round_trip::<AuthProjectCreation>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/company-binding",
            "/api/v1/admin/auth-projects/p-1/company-binding",
            |c| drop(c.custd.bind_auth_project_company("p-1")),
            round_trip::<AuthProjectCompanyBinding>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/delete",
            "/api/v1/admin/auth-projects/p-1/delete",
            |c| {
                drop(c.custd.delete_auth_project(
                    "p-1",
                    &body::<AuthProjectDeletionRequest>(r#"{"confirmSlug":"x"}"#),
                ))
            },
            round_trip::<AuthProjectDeletion>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments",
            "/api/v1/admin/auth-projects/p-1/environments",
            |c| {
                drop(c.custd.create_auth_project_environment("p-1", &body::<AuthProjectEnvironmentCreateRequest>(r#"{"audienceEntitlementMode":"organisation_membership","identityMode":"isolated","name":"x","slug":"x"}"#)))
            },
            round_trip::<AuthProjectSummary>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/delete",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/delete",
            |c| {
                drop(c.custd.delete_auth_project_environment(
                    "p-1",
                    "e-1",
                    &body::<AuthProjectEnvironmentDeletionRequest>(r#"{"confirmSlug":"x"}"#),
                ))
            },
            round_trip::<AuthProjectEnvironmentDeletion>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/offboard",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/offboard",
            |c| {
                drop(c.custd.offboard_auth_project_environment(
                    "p-1",
                    "e-1",
                    &body::<AuthProjectEnvironmentOffboardRequest>(r#"{"confirmSlug":"x"}"#),
                ))
            },
            round_trip::<AuthProjectEnvironmentOffboarding>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/apply",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/apply",
            |c| {
                drop(c.custd.apply_auth_project("p-1", "e-1", &body::<AuthProjectDesiredStateRequest>(r#"{"desiredState":{"audiences":[],"brandAccent":"x","displayName":"x","displayNameSource":"x","entryPath":"x","identityMode":"isolated","loginPaused":true,"profileFields":[],"registrationPolicy":"invite_only","signInMethods":[]},"expectedRevision":1}"#), "key-0001"))
            },
            round_trip::<AuthProjectOperation>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/preview",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/preview",
            |c| {
                drop(c.custd.preview_auth_project("p-1", "e-1", &body::<AuthProjectDesiredStateRequest>(r#"{"desiredState":{"audiences":[],"brandAccent":"x","displayName":"x","displayNameSource":"x","entryPath":"x","identityMode":"isolated","loginPaused":true,"profileFields":[],"registrationPolicy":"invite_only","signInMethods":[]},"expectedRevision":1}"#)))
            },
            round_trip::<AuthProjectPreview>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/status",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/status",
            |c| drop(c.custd.get_auth_project_status("p-1", "e-1")),
            round_trip::<AuthProjectStatus>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/capability",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/capability",
            |c| drop(c.custd.get_auth_project_capability("p-1", "e-1")),
            round_trip::<AuthProjectCapability>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/clients/reconcile",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/clients/reconcile",
            |c| {
                drop(c.custd.reconcile_auth_project_clients(
                    "p-1",
                    "e-1",
                    &body::<AuthProjectClientSyncRequest>(r#"{"expectedRevision":1}"#),
                    "key-0001",
                ))
            },
            round_trip::<AuthProjectClientSyncReport>,
        ),
        row(
            "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/app-links",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/app-links",
            |c| drop(c.custd.list_auth_project_app_links("p-1", "e-1")),
            round_trip::<AppItemEnvironmentLinkList>,
        ),
    ]
}
