//! Tenant offboarding (Admin API `/api/v1/admin/offboarding`): schedules and one-off requests with
//! their preview, export, execution and receipt.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingScheduleListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub schedules: Vec<OffboardingSchedule>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingSchedule {
    pub effective_at: String,
    pub grace_period_days: i64,
    pub reason: String,
    pub status: String,
    pub tenant_slug: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingScheduleRequest {
    pub effective_at: String,
    pub grace_period_days: i64,
    pub reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    pub tenant_slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingCancelRequest {
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingRequestBody {
    pub confirmation: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingRequestResponse {
    pub request_uuid: String,
    pub requested_at: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingRequestCancellation {
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingPreviewResponse {
    pub complete: bool,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub exclusions: Vec<TenantOffboardingExclusion>,
    pub expires_at: String,
    pub generated_at: String,
    pub partial: bool,
    pub preview_inventory_digest: String,
    pub request_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub stores: Vec<TenantOffboardingPreviewItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantOffboardingExclusion {
    pub reason: String,
    pub store: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantOffboardingPreviewItem {
    #[serde(rename = "estimated_count")]
    pub estimated_count: i64,
    pub kind: String,
    #[serde(rename = "retention_class")]
    pub retention_class: String,
    #[serde(
        rename = "source_authority",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub source_authority: Option<String>,
    pub store: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingExportResponse {
    pub byte_size: i64,
    pub checksum_sha256: String,
    pub expires_at: String,
    pub generated_at: String,
    pub preview_inventory_digest: String,
    pub record_count: i64,
    pub request_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OffboardingExecuteRequest {
    #[serde(rename = "waiver_reason")]
    pub waiver_reason: String,
    #[serde(rename = "waiver_role")]
    pub waiver_role: String,
    #[serde(rename = "waiver_timestamp")]
    pub waiver_timestamp: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantOffboardingReceipt {
    #[serde(rename = "company_id")]
    pub company_id: i64,
    #[serde(rename = "completed_at")]
    pub completed_at: String,
    #[serde(rename = "final_state")]
    pub final_state: String,
    #[serde(rename = "per_store", default, deserialize_with = "null_as_empty")]
    pub per_store: Vec<TenantReceiptPerStore>,
    #[serde(rename = "requested_at")]
    pub requested_at: String,
    #[serde(rename = "requested_by_kind")]
    pub requested_by_kind: String,
    pub sha256: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub waiver: Option<TenantReceiptWaiver>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantReceiptPerStore {
    #[serde(rename = "deleted_count")]
    pub deleted_count: i64,
    #[serde(rename = "retained_exceptions_count")]
    pub retained_exceptions_count: i64,
    #[serde(rename = "retention_class")]
    pub retention_class: String,
    pub store: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantReceiptWaiver {
    pub role: String,
    pub timestamp: String,
}

impl CustdClient {
    /// List all offboarding schedules.
    pub fn list_offboarding_schedules(&self) -> Result<OffboardingScheduleListResponse> {
        let path = api_path("/api/v1/admin/offboarding/schedules".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Schedule a delayed offboarding.
    pub fn schedule_offboarding(
        &self,
        request: &OffboardingScheduleRequest,
    ) -> Result<OffboardingSchedule> {
        let path = api_path("/api/v1/admin/offboarding/schedules".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a tenant's offboarding schedule.
    pub fn get_offboarding(&self, tenant_slug: &str) -> Result<OffboardingSchedule> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/schedules/{}",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Cancel a scheduled offboarding.
    pub fn cancel_offboarding(
        &self,
        tenant_slug: &str,
        request: &OffboardingCancelRequest,
    ) -> Result<OffboardingSchedule> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/schedules/{}/cancel",
                percent_encode(tenant_slug)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Request tenant offboarding.
    pub fn request_offboarding(
        &self,
        request: &OffboardingRequestBody,
    ) -> Result<OffboardingRequestResponse> {
        let path = api_path("/api/v1/admin/offboarding".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get tenant offboarding request.
    pub fn get_offboarding_request(
        &self,
        request_uuid: &str,
    ) -> Result<OffboardingRequestResponse> {
        let path = api_path(
            format!("/api/v1/admin/offboarding/{}", percent_encode(request_uuid)),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Confirm tenant offboarding request.
    pub fn confirm_offboarding_request(
        &self,
        request_uuid: &str,
    ) -> Result<OffboardingRequestResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/{}/confirm",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Cancel tenant offboarding request.
    pub fn cancel_offboarding_request(
        &self,
        request_uuid: &str,
        request: &OffboardingRequestCancellation,
    ) -> Result<OffboardingRequestResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/{}/cancel",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Acknowledge the saved offboarding export.
    pub fn acknowledge_offboarding(
        &self,
        request_uuid: &str,
    ) -> Result<OffboardingRequestResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/requests/{}/acknowledge",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Preview tenant offboarding inventory.
    pub fn preview_offboarding(&self, request_uuid: &str) -> Result<OffboardingPreviewResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/requests/{}/preview",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Build the tenant offboarding export.
    pub fn export_offboarding(&self, request_uuid: &str) -> Result<OffboardingExportResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/requests/{}/export",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Execute destructive tenant offboarding.
    pub fn execute_offboarding(
        &self,
        request_uuid: &str,
        request: &OffboardingExecuteRequest,
    ) -> Result<TenantOffboardingReceipt> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/requests/{}/execute",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Retry destructive tenant offboarding.
    pub fn retry_offboarding(&self, request_uuid: &str) -> Result<TenantOffboardingReceipt> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/requests/{}/retry",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Get the destructive offboarding receipt.
    pub fn get_offboarding_receipt(&self, request_uuid: &str) -> Result<TenantOffboardingReceipt> {
        let path = api_path(
            format!(
                "/api/v1/admin/offboarding/requests/{}/receipt",
                percent_encode(request_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
