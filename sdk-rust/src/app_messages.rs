//! The signed-in tenant user's private message archive.
use std::io::Read;

use serde::{Deserialize, Serialize};

use crate::api_path::NO_BODY;
use crate::client::{CustdClient, decode};
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};
use crate::{Error, Result};

const ROOT: &str = "/api/v1/app/messages";
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
        if upload.image.is_empty() || upload.image.len() > MAX_MEDIA_BYTES {
            return Err(Error::InvalidInput(
                "archive image must contain 1 byte to 10 MiB".into(),
            ));
        }
        let path = format!("{ROOT}/{}/media", percent_encode(&upload.message_uuid));
        let response = self.send_bytes(
            Method::Put,
            &path,
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
