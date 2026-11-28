//! The signed-in owner's private message archive.

use serde::{Deserialize, Serialize};

use crate::api_path::NO_BODY;
use crate::client::{CustdClient, decode};
use crate::transport::Method;
use crate::{Error, Result};

const ARCHIVE_PATH: &str = "/api/v1/app/messages";

pub const APP_MESSAGES_MAX_BATCH_MESSAGES: usize = 100;
pub const APP_MESSAGES_MAX_BATCH_BYTES: usize = 2 << 20;

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessagesSession {
    pub company_slug: String,
    pub principal_id: String,
    pub import_allowed: bool,
    pub whatsapp_source_generation: Option<i64>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AppMessageSource {
    Sms,
    IMessage,
    WhatsApp,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageDirection {
    Incoming,
    Outgoing,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageInput {
    pub external_id: String,
    pub thread_id: Option<String>,
    pub sender: Option<String>,
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
    pub messages: Vec<AppMessageInput>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_generation: Option<i64>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppMessageImportStatus {
    Accepted,
    AlreadyAccepted,
    /// An archive mutation superseded the source message. No message UUID is returned.
    Suppressed,
    Invalid,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageImportResult {
    pub external_id: String,
    pub status: AppMessageImportStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessagesBatchResponse {
    pub results: Vec<AppMessageImportResult>,
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
#[serde(rename_all = "camelCase")]
pub struct AppMessagesMutationResponse {
    pub results: Vec<AppMessageMutationResult>,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMessageMedia {
    pub media_uuid: String,
    pub content_type: String,
    pub byte_count: u64,
    pub ocr_status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ocr_text: Option<String>,
}

impl CustdClient {
    /// Verify the company, owner and import access granted by the current bearer token.
    pub fn get_app_messages_session(&self) -> Result<AppMessagesSession> {
        self.call(Method::Get, &format!("{ARCHIVE_PATH}/session"), NO_BODY)
    }

    /// Import messages from one source and receive the outcome for each item in request order.
    pub fn import_app_messages_batch(
        &self,
        request: &AppMessagesBatchRequest,
    ) -> Result<AppMessagesBatchResponse> {
        self.call(
            Method::Post,
            &format!("{ARCHIVE_PATH}/batch"),
            Some(request),
        )
    }

    /// Apply edits and revocations to messages from one source in the owner's archive.
    pub fn mutate_app_messages(
        &self,
        request: &AppMessagesMutationRequest,
    ) -> Result<AppMessagesMutationResponse> {
        self.call(
            Method::Post,
            &format!("{ARCHIVE_PATH}/mutations"),
            Some(request),
        )
    }

    /// Attach the original JPEG or PNG to a message in the signed-in owner's archive.
    pub fn upload_app_message_media(
        &self,
        message_uuid: &str,
        image: Vec<u8>,
    ) -> Result<AppMessageMedia> {
        self.upload_app_message_media_inner(message_uuid, image, &[])
    }

    /// Attach native WhatsApp media to the pinned generation of the private source.
    pub fn upload_app_message_media_with_generation(
        &self,
        message_uuid: &str,
        image: Vec<u8>,
        generation: i64,
    ) -> Result<AppMessageMedia> {
        if generation <= 0 {
            return Err(Error::InvalidInput(
                "archive source generation must be positive".to_owned(),
            ));
        }
        let generation = generation.to_string();
        self.upload_app_message_media_inner(
            message_uuid,
            image,
            &[("X-Custd-Source-Generation", &generation)],
        )
    }

    fn upload_app_message_media_inner(
        &self,
        message_uuid: &str,
        image: Vec<u8>,
        headers: &[(&'static str, &str)],
    ) -> Result<AppMessageMedia> {
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
                "archive message ID must be a UUID".to_owned(),
            ));
        }
        let path = format!("{ARCHIVE_PATH}/{message_uuid}/media");
        let response = self.send_bytes_with_headers(
            Method::Put,
            &path,
            headers,
            Some(("application/octet-stream", image)),
        )?;
        decode(&response.body)
    }
}
