//! Routes whose body is not JSON: images, hosted-app release files, report export downloads, the
//! audit-event export and offboarding export downloads. The audit export and the offboarding
//! archive stream into the caller's writer instead of memory.

use std::io::{self, Read, Write};

use crate::api_path::api_path;
use crate::client::{CustdClient, decode};
use crate::error::Error;
use crate::transport::{HttpResponse, HttpStream, Method, percent_encode};
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

/// What an audit export answered with; the events themselves went to the caller's writer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuditEventExport {
    pub content_type: String,
    /// The server's `X-Request-Id`, when it sent one.
    pub request_id: Option<String>,
}

/// What a tenant offboarding archive download answered with, checked against the server's
/// `X-Checksum-SHA256` and `Content-Length` headers; the archive went to the caller's writer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OffboardingDownload {
    pub content_type: String,
    /// The server's `X-Request-Id`, when it sent one.
    pub request_id: Option<String>,
    /// Lowercase hex SHA-256 of the archive.
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

    /// Export the audit events the filters select, as CSV or JSON, streaming them into `sink`.
    /// The page fields `limit` and `cursor` do not apply to an export and are not sent.
    pub fn export_audit_events(
        &self,
        query: &AuditEventQuery,
        format: AuditEventsFormat,
        company_slug: Option<&str>,
        sink: &mut impl Write,
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
                ("environmentId", query.environment_id.clone()),
                ("format", Some(format.as_str().to_owned())),
            ],
            company_slug,
        );
        let mut stream = self.stream_get(&path)?;
        copy_download(&mut stream, sink)?;
        Ok(AuditEventExport {
            content_type: stream_content_type(&stream),
            request_id: stream.header(REQUEST_ID_HEADER).map(str::to_owned),
        })
    }

    /// Download a finished offboarding request's export archive, streaming it into `sink`. A
    /// missing or invalid checksum or length header is refused before anything is written. The
    /// checksum and length are verified once the archive has arrived; on a mismatch the error is
    /// returned after the bytes were written, so the caller must discard what `sink` received.
    pub fn download_offboarding(
        &self,
        request_uuid: &str,
        sink: &mut impl Write,
    ) -> Result<OffboardingDownload> {
        let path = format!(
            "/api/v1/admin/offboarding/requests/{}/download",
            percent_encode(request_uuid)
        );
        let mut stream = self.stream_get(&path)?;
        let (checksum_sha256, byte_size) = offboarding_integrity(&stream)?;
        let mut hashed = HashingWriter {
            inner: sink,
            digest: ring::digest::Context::new(&ring::digest::SHA256),
        };
        let written = copy_download(&mut stream, &mut hashed)?;
        let invalid =
            |message: &str| Error::InvalidResponse(format!("offboarding download {message}"));
        if hex(hashed.digest.finish().as_ref()) != checksum_sha256 {
            return Err(invalid("checksum mismatch"));
        }
        if written != byte_size {
            return Err(invalid("content length mismatch"));
        }
        Ok(OffboardingDownload {
            content_type: stream_content_type(&stream),
            request_id: stream.header(REQUEST_ID_HEADER).map(str::to_owned),
            checksum_sha256,
            byte_size,
        })
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

const REQUEST_ID_HEADER: &str = "x-request-id";

/// The SHA-256 checksum and byte length the server declared for an offboarding archive.
fn offboarding_integrity(stream: &HttpStream) -> Result<(String, u64)> {
    let invalid = |message: &str| Error::InvalidResponse(format!("offboarding download {message}"));
    let byte_size: u64 = stream
        .header("content-length")
        .and_then(|value| value.trim().parse().ok())
        .ok_or_else(|| invalid("content length is invalid"))?;
    let checksum_sha256 = stream
        .header("x-checksum-sha256")
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| value.len() == 64 && value.bytes().all(|b| b.is_ascii_hexdigit()))
        .ok_or_else(|| invalid("checksum header is invalid"))?;
    Ok((checksum_sha256, byte_size))
}

/// Copies a download body into the caller's writer, keeping the read and write failures apart.
fn copy_download(stream: &mut HttpStream, sink: &mut impl Write) -> Result<u64> {
    let mut buffer = [0u8; 64 * 1024];
    let mut written = 0u64;
    loop {
        let read = match stream.body.read(&mut buffer) {
            Ok(0) => break,
            Ok(read) => read,
            Err(error) if error.kind() == io::ErrorKind::Interrupted => continue,
            Err(error) => return Err(Error::Transport(format!("reading the download: {error}"))),
        };
        sink.write_all(&buffer[..read])
            .map_err(|error| Error::Transport(format!("writing the download: {error}")))?;
        written += read as u64;
    }
    sink.flush()
        .map_err(|error| Error::Transport(format!("writing the download: {error}")))?;
    Ok(written)
}

/// A writer that hashes what passes through it.
struct HashingWriter<'a, W: Write> {
    inner: &'a mut W,
    digest: ring::digest::Context,
}

impl<W: Write> Write for HashingWriter<'_, W> {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        let written = self.inner.write(bytes)?;
        self.digest.update(&bytes[..written]);
        Ok(written)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.inner.flush()
    }
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn stream_content_type(stream: &HttpStream) -> String {
    stream
        .header("content-type")
        .unwrap_or("application/octet-stream")
        .to_owned()
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
