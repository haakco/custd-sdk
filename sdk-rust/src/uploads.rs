//! Routes whose body is not JSON: images, hosted-app release files, report export downloads, the
//! audit-event export and offboarding export downloads.

use crate::api_path::api_path;
use crate::client::{CustdClient, decode};
use crate::error::Error;
use crate::transport::{HttpResponse, Method, percent_encode};
use crate::{
    AuditEventQuery, AuditEventsFormat, AuthProjectAppUploadedFile, AuthProjectBrandLogo,
    CurrentApplicationProfile, Result,
};

const PROFILE_PHOTO_PATH: &str = "/api/v1/app/profile/photo";
const LOGO_BOUNDARY: &str = "custd-sdk-logo-5f0c2a9e7b4d1386";

/// A downloaded report export artifact and its media type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReportExportDownload {
    pub content_type: String,
    pub bytes: Vec<u8>,
}

/// Exported audit events (CSV or JSON) and their media type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuditEventExport {
    pub content_type: String,
    pub bytes: Vec<u8>,
}

/// A tenant offboarding export archive, its media type and the integrity metadata it was checked
/// against: the server's `X-Checksum-SHA256` and `Content-Length` headers.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OffboardingDownload {
    pub content_type: String,
    pub bytes: Vec<u8>,
    /// Lowercase hex SHA-256 of `bytes`.
    pub checksum_sha256: String,
    pub byte_size: u64,
}

/// An image and its media type: `image/png` or `image/webp`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImageFile {
    pub content_type: String,
    pub bytes: Vec<u8>,
}

impl CustdClient {
    /// Upload an environment's sign-in brand logo (PNG or WebP).
    pub fn set_auth_project_brand_logo(
        &self,
        project_id: &str,
        environment_id: &str,
        logo: &ImageFile,
    ) -> Result<AuthProjectBrandLogo> {
        let path = format!(
            "/api/v1/admin/auth-projects/{}/environments/{}/brand/logo",
            percent_encode(project_id),
            percent_encode(environment_id)
        );
        let content_type = format!("multipart/form-data; boundary={LOGO_BOUNDARY}");
        let response =
            self.send_bytes(Method::Post, &path, Some((&content_type, logo_form(logo)?)))?;
        decode(&response.body)
    }

    /// Upload one file of a release; `file_path` is its manifest path, such as `assets/index.js`.
    pub fn upload_auth_project_app_release_file(
        &self,
        project_id: &str,
        environment_id: &str,
        release_id: &str,
        file_path: &str,
        bytes: &[u8],
    ) -> Result<AuthProjectAppUploadedFile> {
        let path = format!(
            "/api/v1/admin/auth-projects/{}/environments/{}/releases/{}/files?path={}",
            percent_encode(project_id),
            percent_encode(environment_id),
            percent_encode(release_id),
            percent_encode(file_path)
        );
        let content = Some(("application/octet-stream", bytes.to_vec()));
        decode(&self.send_bytes(Method::Post, &path, content)?.body)
    }

    /// Download one artifact of a finished report export.
    pub fn download_report_export(
        &self,
        export_id: &str,
        artifact_id: &str,
    ) -> Result<ReportExportDownload> {
        let path = format!(
            "/api/v1/reporting/exports/{}/artifacts/{}",
            percent_encode(export_id),
            percent_encode(artifact_id)
        );
        let response = self.send_bytes(Method::Get, &path, None)?;
        Ok(ReportExportDownload {
            content_type: content_type_of(&response),
            bytes: response.body,
        })
    }

    /// Export the audit events the filters select, as CSV or JSON. The page fields `limit` and
    /// `cursor` do not apply to an export and are not sent.
    pub fn export_audit_events(
        &self,
        query: &AuditEventQuery,
        format: AuditEventsFormat,
        company_slug: Option<&str>,
    ) -> Result<AuditEventExport> {
        let path = api_path(
            "/api/v1/admin/audit/events/export".to_owned(),
            &[
                ("scope", query.scope.map(|v| v.as_str().to_owned())),
                ("affectedTenantSlug", query.affected_tenant_slug.clone()),
                ("since", query.since.clone()),
                ("until", query.until.clone()),
                ("actorKind", query.actor_kind.clone()),
                ("actorReference", query.actor_reference.clone()),
                ("action", query.action.clone()),
                ("resourceType", query.resource_type.clone()),
                ("resourceId", query.resource_id.clone()),
                ("outcome", query.outcome.clone()),
                ("correlationId", query.correlation_id.clone()),
                ("format", Some(format.as_str().to_owned())),
            ],
            company_slug,
        );
        let response = self.send_bytes(Method::Get, &path, None)?;
        Ok(AuditEventExport {
            content_type: content_type_of(&response),
            bytes: response.body,
        })
    }

    /// Download a finished offboarding request's export archive. A missing or inconsistent checksum
    /// or length header is refused, so a truncated or altered archive never reaches the caller.
    pub fn download_offboarding(&self, request_uuid: &str) -> Result<OffboardingDownload> {
        let path = format!(
            "/api/v1/admin/offboarding/requests/{}/download",
            percent_encode(request_uuid)
        );
        verified_offboarding_download(self.send_bytes(Method::Get, &path, None)?)
    }

    /// Read the signed-in member's profile photo. The client's token is the member's application
    /// access token with the profile grant.
    pub fn get_current_app_profile_photo(&self) -> Result<ImageFile> {
        let response = self.send_bytes(Method::Get, PROFILE_PHOTO_PATH, None)?;
        let content_type = response
            .header("content-type")
            .ok_or_else(|| Error::Decode("the profile photo has no content type".to_owned()))?
            .to_owned();
        Ok(ImageFile {
            content_type,
            bytes: response.body,
        })
    }

    /// Replace the signed-in member's profile photo (PNG or WebP, at most 256 KiB).
    pub fn update_current_app_profile_photo(
        &self,
        photo: &ImageFile,
    ) -> Result<CurrentApplicationProfile> {
        self.write_profile_photo(Method::Put, photo)
    }

    /// Set the signed-in member's profile photo only if it was never set.
    pub fn initialize_current_app_profile_photo(
        &self,
        photo: &ImageFile,
    ) -> Result<CurrentApplicationProfile> {
        self.write_profile_photo(Method::Post, photo)
    }

    fn write_profile_photo(
        &self,
        method: Method,
        photo: &ImageFile,
    ) -> Result<CurrentApplicationProfile> {
        let content = Some((photo.content_type.as_str(), photo.bytes.clone()));
        decode(&self.send_bytes(method, PROFILE_PHOTO_PATH, content)?.body)
    }
}

fn verified_offboarding_download(response: HttpResponse) -> Result<OffboardingDownload> {
    let invalid = |message: &str| Error::InvalidResponse(format!("offboarding download {message}"));
    let byte_size: u64 = response
        .header("content-length")
        .and_then(|value| value.trim().parse().ok())
        .ok_or_else(|| invalid("content length is invalid"))?;
    let checksum = response
        .header("x-checksum-sha256")
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| value.len() == 64 && value.bytes().all(|b| b.is_ascii_hexdigit()))
        .ok_or_else(|| invalid("checksum header is invalid"))?;
    if checksum != sha256_hex(&response.body) {
        return Err(invalid("checksum mismatch"));
    }
    if byte_size != response.body.len() as u64 {
        return Err(invalid("content length mismatch"));
    }
    Ok(OffboardingDownload {
        content_type: content_type_of(&response),
        bytes: response.body,
        checksum_sha256: checksum,
        byte_size,
    })
}

fn sha256_hex(bytes: &[u8]) -> String {
    ring::digest::digest(&ring::digest::SHA256, bytes)
        .as_ref()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn content_type_of(response: &HttpResponse) -> String {
    response
        .header("content-type")
        .unwrap_or("application/octet-stream")
        .to_owned()
}

/// A `multipart/form-data` body with the one `logo` file part.
fn logo_form(logo: &ImageFile) -> Result<Vec<u8>> {
    let boundary = LOGO_BOUNDARY.as_bytes();
    if logo
        .bytes
        .windows(boundary.len())
        .any(|window| window == boundary)
    {
        return Err(Error::InvalidInput(
            "the logo contains the multipart boundary".to_owned(),
        ));
    }
    let mut form = format!(
        "--{LOGO_BOUNDARY}\r\nContent-Disposition: form-data; name=\"logo\"; filename=\"logo\"\r\nContent-Type: {}\r\n\r\n",
        logo.content_type
    )
    .into_bytes();
    form.extend_from_slice(&logo.bytes);
    form.extend_from_slice(format!("\r\n--{LOGO_BOUNDARY}--\r\n").as_bytes());
    Ok(form)
}
