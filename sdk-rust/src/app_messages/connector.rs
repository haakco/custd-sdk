//! Scoped WhatsApp connector enrollment, verification, and writes.

use serde::{Deserialize, Serialize};

use crate::api_path::NO_BODY;
use crate::measurement::null_as_empty;
use crate::transport::Method;
use crate::{CustdClient, Error, Result};

use super::{AppMessageMediaMetadata, AppMessageMediaUpload, AppMessageSource, ROOT};

pub const APP_MESSAGES_MAX_BATCH_MESSAGES: usize = 100;
pub const APP_MESSAGES_MAX_BATCH_BYTES: usize = 2 << 20;

/// The archive owner and source generation admitted by a human or connector bearer.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessagesSession {
    pub company_slug: String,
    pub principal_id: String,
    pub import_allowed: bool,
    pub whatsapp_source_generation: Option<i64>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageConnectorState {
    Active,
    Paused,
    Stale,
    Disconnected,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageConnectorConnection {
    Connecting,
    ImportingHistory,
    Syncing,
    Offline,
    PairAgain,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorStatus {
    pub state: AppMessageConnectorState,
    pub grant_id: Option<String>,
    pub source_generation: Option<i64>,
    pub connection_state: Option<AppMessageConnectorConnection>,
    pub pending_media: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub last_report_at: Option<String>,
}

/// A newly issued scoped grant. Keep the one-time bearer in the connector's credential store.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorEnrollment {
    pub status: AppMessageConnectorStatus,
    pub bearer_token: String,
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorReport {
    pub connection_state: AppMessageConnectorConnection,
    pub pending_media: i64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageDirection {
    Incoming,
    Outgoing,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorInput {
    pub external_id: String,
    pub thread_id: Option<String>,
    pub sender: Option<String>,
    #[serde(deserialize_with = "null_as_empty")]
    pub participants: Vec<String>,
    /// RFC 3339 timestamp.
    pub timestamp: String,
    pub direction: AppMessageDirection,
    pub text: String,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessagesBatchRequest {
    pub source: AppMessageSource,
    pub messages: Vec<AppMessageConnectorInput>,
    pub source_generation: i64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageImportStatus {
    Accepted,
    AlreadyAccepted,
    /// A remote revocation suppressed the source message and no UUID is assigned.
    Suppressed,
    Invalid,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorImportResult {
    pub external_id: String,
    pub status: AppMessageImportStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AppMessagesBatchResponse {
    #[serde(deserialize_with = "null_as_empty")]
    pub results: Vec<AppMessageConnectorImportResult>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageMutationKind {
    Edit,
    Revoke,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMutation {
    pub external_id: String,
    pub operation_id: String,
    pub kind: AppMessageMutationKind,
    pub revision: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessagesMutationRequest {
    pub source: AppMessageSource,
    pub mutations: Vec<AppMessageMutation>,
    pub source_generation: i64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageMutationStatus {
    Applied,
    AlreadyApplied,
    Superseded,
    Invalid,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMutationResult {
    pub external_id: String,
    pub operation_id: String,
    pub status: AppMessageMutationStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AppMessagesMutationResponse {
    #[serde(deserialize_with = "null_as_empty")]
    pub results: Vec<AppMessageMutationResult>,
}

impl CustdClient {
    /// Read the signed-in user's archive identity and current source generation.
    pub fn get_app_messages_session(&self) -> Result<AppMessagesSession> {
        self.call(Method::Get, &format!("{ROOT}/session"), NO_BODY)
    }

    /// Replace the owner's WhatsApp connector grant using the human bearer.
    pub fn enroll_app_message_connector(&self) -> Result<AppMessageConnectorEnrollment> {
        self.call(Method::Post, &format!("{ROOT}/connector/enroll"), NO_BODY)
    }

    /// Verify the archive identity and generation admitted by the connector bearer.
    pub fn get_app_message_connector_session(&self) -> Result<AppMessagesSession> {
        self.call(Method::Get, &format!("{ROOT}/connector/session"), NO_BODY)
    }

    /// Report connection state and pending media using the connector bearer.
    pub fn report_app_message_connector(
        &self,
        report: &AppMessageConnectorReport,
    ) -> Result<AppMessageConnectorStatus> {
        self.call(
            Method::Post,
            &format!("{ROOT}/connector/report"),
            Some(report),
        )
    }

    /// Import native WhatsApp messages using the connector bearer and its pinned generation.
    pub fn import_app_messages_batch(
        &self,
        request: &AppMessagesBatchRequest,
    ) -> Result<AppMessagesBatchResponse> {
        validate_connector_source(request.source, request.source_generation)?;
        self.call(Method::Post, &format!("{ROOT}/batch"), Some(request))
    }

    /// Apply native WhatsApp edits and revocations using the connector bearer.
    pub fn mutate_app_messages(
        &self,
        request: &AppMessagesMutationRequest,
    ) -> Result<AppMessagesMutationResponse> {
        validate_connector_source(request.source, request.source_generation)?;
        self.call(Method::Post, &format!("{ROOT}/mutations"), Some(request))
    }

    /// Attach a native WhatsApp image using the connector bearer and its pinned generation.
    pub fn upload_app_message_media_with_generation(
        &self,
        message_uuid: &str,
        image: Vec<u8>,
        generation: i64,
    ) -> Result<AppMessageMediaMetadata> {
        validate_connector_source(AppMessageSource::WhatsApp, generation)?;
        if message_uuid.len() != 36
            || !message_uuid
                .bytes()
                .enumerate()
                .all(|(index, byte)| match index {
                    8 | 13 | 18 | 23 => byte == b'-',
                    _ => byte.is_ascii_hexdigit(),
                })
        {
            return Err(Error::InvalidInput(
                "archive message ID must be a UUID".into(),
            ));
        }
        let upload = AppMessageMediaUpload {
            message_uuid: message_uuid.into(),
            image,
        };
        self.upload_app_message_media_inner(
            upload,
            &[("X-Custd-Source-Generation", &generation.to_string())],
        )
    }
}

fn validate_connector_source(source: AppMessageSource, generation: i64) -> Result<()> {
    if source != AppMessageSource::WhatsApp {
        return Err(Error::InvalidInput(
            "archive connector source must be WhatsApp".into(),
        ));
    }
    if generation <= 0 {
        return Err(Error::InvalidInput(
            "archive source generation must be positive".into(),
        ));
    }
    Ok(())
}
