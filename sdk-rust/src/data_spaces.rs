//! Data spaces and their producer reservations (Admin API).
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
pub struct DataSpaceListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub data_spaces: Vec<DataSpace>,
    pub entitlement: DataSpaceEntitlementState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpace {
    pub company_name: String,
    pub enabled: bool,
    pub parent_company_slug: String,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpaceEntitlementState {
    pub active_data_spaces: i64,
    pub enabled: bool,
    pub max_active_data_spaces: i64,
    pub max_active_producers_per_data_space: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpaceCreateRequest {
    pub company_name: String,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpaceUsageSummary {
    pub data_space_count: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub data_spaces: Vec<DataSpaceUsageRow>,
    pub measured_at: String,
    pub measurement_state: DataSpaceStorageMeasurementState,
    pub parent_company_slug: String,
    pub retained_event_count: i64,
    pub retained_logical_bytes: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpaceUsageRow {
    pub company_name: String,
    pub enabled: bool,
    pub measured_at: String,
    pub measurement_state: DataSpaceStorageMeasurementState,
    pub retained_event_count: i64,
    pub retained_logical_bytes: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revoked_at: Option<String>,
    pub slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpaceStorageMeasurementState {
    pub calculation_version: i64,
    pub completeness_state: String,
    pub source_watermark: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerReservationListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub reservations: Vec<ProducerReservation>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerReservation {
    pub child_company_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claimed_by_client_id: Option<String>,
    pub expires_at: String,
    pub max_ttl_seconds: i64,
    pub parent_company_slug: String,
    pub producer_slug: String,
    pub reserved_at: String,
    pub status: ProducerReservationStatus,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerReservationCreateRequest {
    pub producer_slug: String,
    pub ttl_seconds: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProducerReservationClaimRequest {
    pub claimed_by_client_id: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ProducerReservationStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "claimed")]
    Claimed,
    #[serde(rename = "released")]
    Released,
    #[serde(rename = "expired")]
    Expired,
}

impl ProducerReservationStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Claimed => "claimed",
            Self::Released => "released",
            Self::Expired => "expired",
        }
    }
}

/// The erasure request for one data space and how far it has got.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSpaceErasure {
    pub data_space_slug: String,
    pub parent_company_slug: String,
    pub request_uuid: String,
    pub requested_at: String,
    pub status: DataSpaceErasureStatus,
}

/// Where a data space erasure is in its life.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DataSpaceErasureStatus {
    Requested,
    Erasing,
    Completed,
    Failed,
}

impl CustdClient {
    /// List data spaces.
    pub fn list_data_spaces(
        &self,
        parent_company_slug: Option<&str>,
    ) -> Result<DataSpaceListResponse> {
        let path = api_path(
            "/api/v1/data-spaces".to_owned(),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a data space.
    pub fn create_data_space(
        &self,
        parent_company_slug: Option<&str>,
        request: &DataSpaceCreateRequest,
    ) -> Result<DataSpace> {
        let path = api_path(
            "/api/v1/data-spaces".to_owned(),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get data space usage.
    pub fn get_data_space_usage(
        &self,
        parent_company_slug: Option<&str>,
    ) -> Result<DataSpaceUsageSummary> {
        let path = api_path(
            "/api/v1/data-spaces/usage".to_owned(),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Revoke a data space.
    pub fn revoke_data_space(&self, slug: &str, parent_company_slug: Option<&str>) -> Result<()> {
        let path = api_path(
            format!("/api/v1/data-spaces/{}", percent_encode(slug)),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Ask Custd to erase everything a data space holds. The answer is the accepted request.
    pub fn erase_data_space(
        &self,
        slug: &str,
        parent_company_slug: Option<&str>,
    ) -> Result<DataSpaceErasure> {
        self.call(
            Method::Post,
            &erasure_path(slug, parent_company_slug),
            NO_BODY,
        )
    }

    /// Read the erasure request of a data space.
    pub fn get_data_space_erasure(
        &self,
        slug: &str,
        parent_company_slug: Option<&str>,
    ) -> Result<DataSpaceErasure> {
        self.call(
            Method::Get,
            &erasure_path(slug, parent_company_slug),
            NO_BODY,
        )
    }

    /// List producer reservations for a data space.
    pub fn list_producer_reservations(
        &self,
        slug: &str,
        parent_company_slug: Option<&str>,
    ) -> Result<ProducerReservationListResponse> {
        let path = api_path(
            format!(
                "/api/v1/data-spaces/{}/producer-reservations",
                percent_encode(slug)
            ),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Reserve a producer slot for a data space.
    pub fn reserve_producer_reservation(
        &self,
        slug: &str,
        parent_company_slug: Option<&str>,
        request: &ProducerReservationCreateRequest,
    ) -> Result<ProducerReservation> {
        let path = api_path(
            format!(
                "/api/v1/data-spaces/{}/producer-reservations",
                percent_encode(slug)
            ),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Claim a pending producer reservation.
    pub fn claim_producer_reservation(
        &self,
        slug: &str,
        producer_slug: &str,
        parent_company_slug: Option<&str>,
        request: &ProducerReservationClaimRequest,
    ) -> Result<ProducerReservation> {
        let path = api_path(
            format!(
                "/api/v1/data-spaces/{}/producer-reservations/{}/claim",
                percent_encode(slug),
                percent_encode(producer_slug)
            ),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Release a producer reservation.
    pub fn release_producer_reservation(
        &self,
        slug: &str,
        producer_slug: &str,
        parent_company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/data-spaces/{}/producer-reservations/{}",
                percent_encode(slug),
                percent_encode(producer_slug)
            ),
            &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
            None,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }
}

fn erasure_path(slug: &str, parent_company_slug: Option<&str>) -> String {
    api_path(
        format!("/api/v1/data-spaces/{}/erasure", percent_encode(slug)),
        &[("parentCompanySlug", parent_company_slug.map(str::to_owned))],
        None,
    )
}
