//! The signed-in tenant user's private message archive.
use std::io::Read;

use serde::{Deserialize, Serialize};

use crate::api_path::NO_BODY;
use crate::client::{CustdClient, decode};
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};
use crate::{Error, Result};

const ROOT: &str = "/api/v1/app/messages";
const SOURCE_GENERATION_HEADER: &str = "X-Custd-Source-Generation";
const MAX_MEDIA_BYTES: usize = 10 * 1024 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AppMessageSource {
    Sms,
    IMessage,
    WhatsApp,
}

impl AppMessageSource {
    fn path(self) -> &'static str {
        match self {
            Self::Sms => "sms",
            Self::IMessage => "imessage",
            Self::WhatsApp => "whatsapp",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageSession {
    pub company_slug: String,
    pub principal_id: String,
    pub import_allowed: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub whatsapp_source_generation: Option<i64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageConnectorState {
    Active,
    Paused,
    Stale,
    Disconnected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageConnectorAction {
    Pause,
    Resume,
    Disconnect,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageConnectorConnection {
    Connecting,
    ImportingHistory,
    Syncing,
    Offline,
    PairAgain,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageMutationKind {
    Edit,
    Revoke,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorControl {
    pub action: AppMessageConnectorAction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorReport {
    pub connection_state: AppMessageConnectorConnection,
    pub pending_media: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorStatus {
    pub state: AppMessageConnectorState,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub grant_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_generation: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_report_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending_media: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub connection_state: Option<AppMessageConnectorConnection>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorEnrollment {
    pub status: AppMessageConnectorStatus,
    pub bearer_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageConnectorBatch {
    pub source: AppMessageSource,
    pub messages: Vec<AppMessageInput>,
    pub source_generation: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMutation {
    pub external_id: String,
    pub operation_id: String,
    pub kind: AppMessageMutationKind,
    pub revision: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMutationBatch {
    pub source: AppMessageSource,
    pub mutations: Vec<AppMessageMutation>,
    pub source_generation: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMutationResult {
    pub external_id: String,
    pub operation_id: String,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMutationBatchResponse {
    #[serde(deserialize_with = "null_as_empty")]
    pub results: Vec<AppMessageMutationResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageInput {
    pub external_id: String,
    pub thread_id: Option<String>,
    pub sender: Option<String>,
    #[serde(deserialize_with = "null_as_empty")]
    pub participants: Vec<String>,
    pub timestamp: String,
    pub direction: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageBatchRequest {
    pub source: AppMessageSource,
    pub messages: Vec<AppMessageInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageImportResult {
    pub external_id: String,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppMessageBatchResponse {
    #[serde(deserialize_with = "null_as_empty")]
    pub results: Vec<AppMessageImportResult>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageSearchRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub query: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<AppMessageSource>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thread_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMediaMetadata {
    pub media_uuid: String,
    pub content_type: String,
    pub byte_count: i64,
    pub ocr_status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ocr_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessage {
    pub message_uuid: String,
    pub source: String,
    pub external_id: String,
    pub thread_id: String,
    pub sender: String,
    #[serde(deserialize_with = "null_as_empty")]
    pub participants: Vec<String>,
    pub timestamp: String,
    pub direction: String,
    pub text: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub media: Vec<AppMessageMediaMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageSearchResponse {
    #[serde(deserialize_with = "null_as_empty")]
    pub messages: Vec<AppMessage>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppMessageReadResponse {
    pub message: AppMessage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageDeleteSourceResponse {
    pub source: String,
    pub deleted_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_generation: Option<i64>,
}

pub struct AppMessageMediaUpload {
    pub message_uuid: String,
    pub image: Vec<u8>,
}

pub struct AppMessageMediaRef {
    pub message_uuid: String,
    pub media_uuid: String,
}

pub struct AppMessageMedia {
    pub content_type: String,
    pub image: Vec<u8>,
}

impl CustdClient {
    pub fn app_message_session(&self) -> Result<AppMessageSession> {
        self.call(Method::Get, &format!("{ROOT}/session"), NO_BODY)
    }

    /// Read the signed-in archive owner's connector.
    pub fn get_app_message_connector(&self) -> Result<AppMessageConnectorStatus> {
        self.call(Method::Get, &format!("{ROOT}/connector"), NO_BODY)
    }

    /// Use a human tenant administrator token. The connector bearer is returned once.
    pub fn enroll_app_message_connector(&self) -> Result<AppMessageConnectorEnrollment> {
        self.call(Method::Post, &format!("{ROOT}/connector/enroll"), NO_BODY)
    }

    pub fn control_app_message_connector(
        &self,
        request: &AppMessageConnectorControl,
    ) -> Result<AppMessageConnectorStatus> {
        self.call(
            Method::Post,
            &format!("{ROOT}/connector/control"),
            Some(request),
        )
    }

    /// Verify a connector bearer and read its bound archive generation.
    pub fn app_message_connector_session(&self) -> Result<AppMessageSession> {
        self.call(Method::Get, &format!("{ROOT}/connector/session"), NO_BODY)
    }

    /// Report connection state using the connector bearer.
    pub fn report_app_message_connector(
        &self,
        request: &AppMessageConnectorReport,
    ) -> Result<AppMessageConnectorStatus> {
        self.call(
            Method::Post,
            &format!("{ROOT}/connector/report"),
            Some(request),
        )
    }

    /// Apply native edits or revocations using the connector bearer.
    pub fn mutate_app_messages(
        &self,
        request: &AppMessageMutationBatch,
    ) -> Result<AppMessageMutationBatchResponse> {
        self.call(Method::Post, &format!("{ROOT}/mutations"), Some(request))
    }

    /// Import native messages using a connector bearer and its source generation.
    pub fn import_app_connector_messages(
        &self,
        request: &AppMessageConnectorBatch,
    ) -> Result<AppMessageBatchResponse> {
        self.call(Method::Post, &format!("{ROOT}/batch"), Some(request))
    }

    pub fn import_app_messages(
        &self,
        request: &AppMessageBatchRequest,
    ) -> Result<AppMessageBatchResponse> {
        self.call(Method::Post, &format!("{ROOT}/batch"), Some(request))
    }

    pub fn search_app_messages(
        &self,
        request: &AppMessageSearchRequest,
    ) -> Result<AppMessageSearchResponse> {
        self.call(Method::Post, &format!("{ROOT}/search"), Some(request))
    }

    pub fn get_app_message(&self, message_uuid: &str) -> Result<AppMessageReadResponse> {
        self.call(
            Method::Get,
            &format!("{ROOT}/{}", percent_encode(message_uuid)),
            NO_BODY,
        )
    }

    pub fn delete_app_message_source(
        &self,
        source: AppMessageSource,
    ) -> Result<AppMessageDeleteSourceResponse> {
        self.call(
            Method::Delete,
            &format!("{ROOT}/sources/{}", source.path()),
            NO_BODY,
        )
    }

    pub fn upload_app_message_media(
        &self,
        upload: AppMessageMediaUpload,
    ) -> Result<AppMessageMediaMetadata> {
        self.upload_archive_media(upload, None)
    }

    /// Upload native media using a connector bearer and its source generation.
    pub fn upload_app_connector_media(
        &self,
        upload: AppMessageMediaUpload,
        source_generation: i64,
    ) -> Result<AppMessageMediaMetadata> {
        if source_generation < 1 {
            return Err(Error::InvalidInput(
                "archive source generation must be positive".into(),
            ));
        }
        self.upload_archive_media(upload, Some(source_generation))
    }

    fn upload_archive_media(
        &self,
        upload: AppMessageMediaUpload,
        source_generation: Option<i64>,
    ) -> Result<AppMessageMediaMetadata> {
        if upload.image.is_empty() || upload.image.len() > MAX_MEDIA_BYTES {
            return Err(Error::InvalidInput(
                "archive image must contain 1 byte to 10 MiB".into(),
            ));
        }
        let path = format!("{ROOT}/{}/media", percent_encode(&upload.message_uuid));
        let generation = source_generation.map(|value| value.to_string());
        let headers: Vec<_> = generation
            .as_deref()
            .map(|value| (SOURCE_GENERATION_HEADER, value))
            .into_iter()
            .collect();
        let response = self.send_bytes_with_headers(
            Method::Put,
            &path,
            &headers,
            Some(("application/octet-stream", upload.image)),
        )?;
        decode(&response.body)
    }

    pub fn download_app_message_media(
        &self,
        reference: &AppMessageMediaRef,
    ) -> Result<AppMessageMedia> {
        let path = format!(
            "{ROOT}/{}/media/{}",
            percent_encode(&reference.message_uuid),
            percent_encode(&reference.media_uuid)
        );
        let response = self.stream_get(&path)?;
        let content_type = match response.header("Content-Type") {
            Some(content_type @ ("image/jpeg" | "image/png")) => content_type.to_owned(),
            _ => {
                return Err(Error::InvalidResponse(
                    "archive image must be JPEG or PNG".into(),
                ));
            }
        };
        let mut image = Vec::new();
        response
            .body
            .take((MAX_MEDIA_BYTES + 1) as u64)
            .read_to_end(&mut image)
            .map_err(|error| Error::Transport(error.to_string()))?;
        if image.is_empty() || image.len() > MAX_MEDIA_BYTES {
            return Err(Error::InvalidResponse(
                "archive image must contain 1 byte to 10 MiB".into(),
            ));
        }
        Ok(AppMessageMedia {
            content_type,
            image,
        })
    }
}
