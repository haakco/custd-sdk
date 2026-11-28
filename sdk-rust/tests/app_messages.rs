mod support;

use custd_sdk::{
    AppMessageDirection, AppMessageImportStatus, AppMessageInput, AppMessageMutation,
    AppMessageMutationKind, AppMessageMutationStatus, AppMessageSource, AppMessagesBatchRequest,
    AppMessagesMutationRequest, CustdClient, Error,
};
use serde_json::{Value, json};
use support::{FakeServer, answer};

const MESSAGE_UUID: &str = "0198a3b2-0000-7000-8000-000000000070";
const IMAGE: &[u8] = b"\0synthetic image\r\n";

#[test]
fn imports_messages_and_uploads_the_original_to_the_acknowledged_message() {
    let outcomes = json!({"results":[
        {"externalId":"native-1","status":"already_accepted","messageUuid":MESSAGE_UUID},
        {"externalId":"native-2","status":"invalid","errorCode":"external_id_conflict"},
        {"externalId":"native-3","status":"suppressed"},
    ]});
    let server = FakeServer::start(vec![
        answer(
            200,
            r#"{"companySlug":"acme","principalId":"person-1","importAllowed":true}"#,
        ),
        answer(200, &outcomes.to_string()),
        answer(
            200,
            r#"{"mediaUuid":"image-1","contentType":"image/png","byteCount":18,"ocrStatus":"pending"}"#,
        ),
    ]);
    let client = CustdClient::new(&server.base_url, "owner-token");
    let session = client.get_app_messages_session().unwrap();
    assert_eq!(session.company_slug, "acme");
    assert_eq!(session.principal_id, "person-1");
    assert!(session.import_allowed);

    let message = AppMessageInput {
        external_id: "native-1".to_owned(),
        thread_id: Some("chat-1".to_owned()),
        sender: None,
        participants: vec!["person-2".to_owned()],
        timestamp: "2026-11-28T08:00:00Z".to_owned(),
        direction: AppMessageDirection::Incoming,
        text: "Fixture message".to_owned(),
    };
    let batch = client
        .import_app_messages_batch(&AppMessagesBatchRequest {
            source: AppMessageSource::WhatsApp,
            messages: vec![
                message.clone(),
                AppMessageInput {
                    external_id: "native-2".to_owned(),
                    ..message.clone()
                },
                AppMessageInput {
                    external_id: "native-3".to_owned(),
                    ..message
                },
            ],
        })
        .unwrap();
    assert_eq!(batch.results[0].external_id, "native-1");
    assert_eq!(
        batch.results[0].status,
        AppMessageImportStatus::AlreadyAccepted
    );
    assert_eq!(batch.results[1].status, AppMessageImportStatus::Invalid);
    assert_eq!(
        batch.results[1].error_code.as_deref(),
        Some("external_id_conflict")
    );
    assert_eq!(batch.results[1].message_uuid, None);
    assert_eq!(batch.results[2].status, AppMessageImportStatus::Suppressed);
    assert_eq!(batch.results[2].message_uuid, None);

    assert!(matches!(
        client.upload_app_message_media("../sources/whatsapp", IMAGE.to_vec()),
        Err(Error::InvalidInput(_))
    ));
    let media = client
        .upload_app_message_media(
            batch.results[0].message_uuid.as_deref().unwrap(),
            IMAGE.to_vec(),
        )
        .unwrap();
    assert_eq!(media.media_uuid, "image-1");
    assert_eq!(media.content_type, "image/png");
    assert_eq!(media.byte_count as usize, IMAGE.len());
    assert_eq!(media.ocr_status, "pending");
    assert_eq!(media.ocr_text, None);

    let [session, batch, upload] = [server.next(), server.next(), server.next()];
    for request in [&session, &batch, &upload] {
        assert_eq!(request.header("authorization"), Some("Bearer owner-token"));
    }
    assert_eq!(session.method, "GET");
    assert_eq!(session.target, "/api/v1/app/messages/session");
    assert!(session.body.is_empty());
    assert_eq!(batch.method, "POST");
    assert_eq!(batch.target, "/api/v1/app/messages/batch");
    assert_eq!(batch.header("content-type"), Some("application/json"));
    let body: Value = serde_json::from_str(&batch.body).unwrap();
    assert_eq!(body["source"], "whatsapp");
    assert_eq!(
        body["messages"][0],
        json!({
            "externalId":"native-1", "threadId":"chat-1", "sender":null,
            "participants":["person-2"], "timestamp":"2026-11-28T08:00:00Z",
            "direction":"incoming", "text":"Fixture message",
        })
    );
    assert_eq!(body["messages"][1]["externalId"], "native-2");
    assert_eq!(upload.method, "PUT");
    assert_eq!(
        upload.target,
        format!("/api/v1/app/messages/{MESSAGE_UUID}/media")
    );
    assert_eq!(
        upload.header("content-type"),
        Some("application/octet-stream")
    );
    assert_eq!(upload.body.as_bytes(), IMAGE);
}

#[test]
fn sends_ordered_archive_mutations_and_decodes_each_result() {
    let server = FakeServer::start(vec![answer(
        200,
        r#"{"results":[
            {"externalId":"native-1","operationId":"edit-1","status":"applied"},
            {"externalId":"native-1","operationId":"edit-1","status":"already_applied"},
            {"externalId":"native-1","operationId":"revoke-1","status":"superseded"},
            {"externalId":"native-2","operationId":"revoke-2","status":"invalid","errorCode":"invalid_revision"}
        ]}"#,
    )]);
    let client = CustdClient::new(&server.base_url, "owner-token");
    let edit = AppMessageMutation {
        external_id: "native-1".to_owned(),
        operation_id: "edit-1".to_owned(),
        kind: AppMessageMutationKind::Edit,
        revision: 5_000_000_001,
        text: Some("Corrected content".to_owned()),
    };
    let revoke = AppMessageMutation {
        external_id: "native-1".to_owned(),
        operation_id: "revoke-1".to_owned(),
        kind: AppMessageMutationKind::Revoke,
        revision: 5_000_000_000,
        text: None,
    };
    let response = client
        .mutate_app_messages(&AppMessagesMutationRequest {
            source: AppMessageSource::WhatsApp,
            mutations: vec![
                edit.clone(),
                edit,
                revoke.clone(),
                AppMessageMutation {
                    external_id: "native-2".to_owned(),
                    operation_id: "revoke-2".to_owned(),
                    revision: -1,
                    ..revoke
                },
            ],
        })
        .unwrap();

    assert_eq!(
        response.results[0].status,
        AppMessageMutationStatus::Applied
    );
    assert_eq!(response.results[0].error_code, None);
    assert_eq!(
        response.results[1].status,
        AppMessageMutationStatus::AlreadyApplied
    );
    assert_eq!(
        response.results[2].status,
        AppMessageMutationStatus::Superseded
    );
    let invalid = &response.results[3];
    assert_eq!(invalid.external_id, "native-2");
    assert_eq!(invalid.operation_id, "revoke-2");
    assert_eq!(invalid.status, AppMessageMutationStatus::Invalid);
    assert_eq!(invalid.error_code.as_deref(), Some("invalid_revision"));

    let request = server.next();
    assert_eq!(request.header("authorization"), Some("Bearer owner-token"));
    assert_eq!(request.header("content-type"), Some("application/json"));
    assert_eq!(request.method, "POST");
    assert_eq!(request.target, "/api/v1/app/messages/mutations");
    let body: Value = serde_json::from_str(&request.body).unwrap();
    assert_eq!(body["source"], "whatsapp");
    assert_eq!(
        body["mutations"][0],
        json!({"externalId":"native-1","operationId":"edit-1","kind":"edit",
               "revision":5_000_000_001_i64,"text":"Corrected content"})
    );
    assert_eq!(body["mutations"][1], body["mutations"][0]);
    assert_eq!(
        body["mutations"][2],
        json!({"externalId":"native-1","operationId":"revoke-1","kind":"revoke",
               "revision":5_000_000_000_i64})
    );
}
