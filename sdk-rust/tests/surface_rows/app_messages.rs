use custd_sdk::{
    AppMessageBatchRequest, AppMessageBatchResponse, AppMessageConnectorAction,
    AppMessageConnectorConnection, AppMessageConnectorControl, AppMessageConnectorEnrollment,
    AppMessageConnectorReport, AppMessageConnectorStatus, AppMessageDeleteSourceResponse,
    AppMessageMediaMetadata, AppMessageMediaRef, AppMessageMediaUpload, AppMessageMutationBatch,
    AppMessageMutationBatchResponse, AppMessageReadResponse, AppMessageSearchRequest,
    AppMessageSearchResponse, AppMessageSession, AppMessageSource,
};

use super::round_trip;
use crate::{Row, bodiless, row};

const MESSAGE: &str = "0195f0a0-0000-4000-8000-000000000001";
const MEDIA: &str = "0195f0a0-0000-4000-8000-000000000002";

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/app/messages/session",
            "/api/v1/app/messages/session",
            |c| {
                let _ = c.custd.app_message_session();
            },
            round_trip::<AppMessageSession>,
        ),
        row(
            "admin-api POST /api/v1/app/messages/batch",
            "/api/v1/app/messages/batch",
            |c| {
                let _ = c.custd.import_app_messages(&AppMessageBatchRequest {
                    source: AppMessageSource::Sms,
                    messages: vec![],
                });
            },
            round_trip::<AppMessageBatchResponse>,
        ),
        row(
            "admin-api POST /api/v1/app/messages/search",
            "/api/v1/app/messages/search",
            |c| {
                let _ = c.custd.search_app_messages(&AppMessageSearchRequest {
                    query: Some("test".into()),
                    ..Default::default()
                });
            },
            round_trip::<AppMessageSearchResponse>,
        ),
        row(
            "admin-api GET /api/v1/app/messages/{messageUuid}",
            "/api/v1/app/messages/0195f0a0-0000-4000-8000-000000000001",
            |c| {
                let _ = c.custd.get_app_message(MESSAGE);
            },
            round_trip::<AppMessageReadResponse>,
        ),
        row(
            "admin-api DELETE /api/v1/app/messages/sources/{source}",
            "/api/v1/app/messages/sources/sms",
            |c| {
                let _ = c.custd.delete_app_message_source(AppMessageSource::Sms);
            },
            round_trip::<AppMessageDeleteSourceResponse>,
        ),
        row(
            "admin-api PUT /api/v1/app/messages/{messageUuid}/media",
            "/api/v1/app/messages/0195f0a0-0000-4000-8000-000000000001/media",
            |c| {
                let _ = c.custd.upload_app_message_media(AppMessageMediaUpload {
                    message_uuid: MESSAGE.into(),
                    image: b"archive-bytes".to_vec(),
                });
            },
            round_trip::<AppMessageMediaMetadata>,
        ),
        bodiless(
            "admin-api GET /api/v1/app/messages/{messageUuid}/media/{mediaUuid}",
            "/api/v1/app/messages/0195f0a0-0000-4000-8000-000000000001/media/0195f0a0-0000-4000-8000-000000000002",
            |c| {
                let _ = c.custd.download_app_message_media(&AppMessageMediaRef {
                    message_uuid: MESSAGE.into(),
                    media_uuid: MEDIA.into(),
                });
            },
        ),
        row(
            "admin-api GET /api/v1/app/messages/connector",
            "/api/v1/app/messages/connector",
            |c| drop(c.custd.get_app_message_connector()),
            round_trip::<AppMessageConnectorStatus>,
        ),
        row(
            "admin-api POST /api/v1/app/messages/connector/control",
            "/api/v1/app/messages/connector/control",
            |c| {
                drop(
                    c.custd
                        .control_app_message_connector(&AppMessageConnectorControl {
                            action: AppMessageConnectorAction::Pause,
                        }),
                )
            },
            round_trip::<AppMessageConnectorStatus>,
        ),
        row(
            "admin-api POST /api/v1/app/messages/connector/enroll",
            "/api/v1/app/messages/connector/enroll",
            |c| drop(c.custd.enroll_app_message_connector()),
            round_trip::<AppMessageConnectorEnrollment>,
        ),
        row(
            "admin-api POST /api/v1/app/messages/connector/report",
            "/api/v1/app/messages/connector/report",
            |c| {
                drop(
                    c.custd
                        .report_app_message_connector(&AppMessageConnectorReport {
                            connection_state: AppMessageConnectorConnection::Syncing,
                            pending_media: 0,
                        }),
                )
            },
            round_trip::<AppMessageConnectorStatus>,
        ),
        row(
            "admin-api GET /api/v1/app/messages/connector/session",
            "/api/v1/app/messages/connector/session",
            |c| drop(c.custd.app_message_connector_session()),
            round_trip::<AppMessageSession>,
        ),
        row(
            "admin-api POST /api/v1/app/messages/mutations",
            "/api/v1/app/messages/mutations",
            |c| {
                drop(c.custd.mutate_app_messages(&AppMessageMutationBatch {
                    source: AppMessageSource::WhatsApp,
                    source_generation: 2,
                    mutations: vec![],
                }))
            },
            round_trip::<AppMessageMutationBatchResponse>,
        ),
    ]
}
