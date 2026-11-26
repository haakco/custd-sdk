//! Uncertainty models: versions and copies (Admin API `/api/v1/admin/uncertainty-models`) and
//! their runs (Analytics API `/api/v1/measurement/uncertainty-models`).
//!
//! Request and response shapes follow the admin-api and analytics-api OpenAPI documents.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::app_item_runs::{AppItemInputSource, AppItemQuantity, AppModelCopyRequest};
use crate::app_models::AppModelQuantityResult;
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub models: Vec<UncertaintyModel>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModel {
    pub created_at: String,
    pub description: String,
    pub latest_version: i64,
    pub model_uuid: String,
    pub name: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelCreateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub quantities: Vec<AppItemQuantity>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelDetail {
    pub created_at: String,
    pub description: String,
    pub latest_version: i64,
    pub model_uuid: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub queued_run_failure: Option<UncertaintyModelQueuedRunFailure>,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<UncertaintyModelVersion>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelQueuedRunFailure {
    pub attempts: i64,
    pub error: String,
    pub failed_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelVersion {
    pub created_at: String,
    pub note: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub quantities: Vec<AppItemQuantity>,
    pub version_number: i64,
    pub version_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelVersionList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub versions: Vec<UncertaintyModelVersionSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelVersionSummary {
    pub created_at: String,
    pub note: String,
    pub quantity_count: i64,
    pub version_number: i64,
    pub version_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelVersionCreateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub quantities: Vec<AppItemQuantity>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelRunList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub runs: Vec<UncertaintyModelRunSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelRunSummary {
    pub created_at: String,
    pub model_uuid: String,
    pub run_uuid: String,
    pub sample_count: i64,
    pub seed: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_forecast_run_uuid: Option<String>,
    pub trigger: UncertaintyModelRunSummaryTrigger,
    pub version_number: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelRunRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub decision: Option<UncertaintyModelDecision>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sample_count: Option<i64>,
    pub seed: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sensitivity_output: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version_number: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelRunDetail {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub bound_inputs: Vec<UncertaintyModelBoundInput>,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub decision: Option<UncertaintyModelDecision>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub information: Option<UncertaintyModelInformation>,
    pub model_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub quantities: Vec<AppModelQuantityResult>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub queued_run_failure: Option<UncertaintyModelQueuedRunFailure>,
    pub run_uuid: String,
    pub sample_count: i64,
    pub seed: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sensitivity: Option<UncertaintyModelSensitivity>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sensitivity_output: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_forecast_run_uuid: Option<String>,
    pub trigger: UncertaintyModelRunSummaryTrigger,
    pub version_number: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelDecision {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub minimum_worthwhile: Option<f64>,
    pub output: String,
    pub threshold: f64,
    pub value_per_unit: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelBoundInput {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub forecast_generated_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub forecast_run_uuid: Option<String>,
    pub quantity: String,
    pub source: AppItemInputSource,
    pub state: UncertaintyModelBoundInputState,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelInformation {
    pub act_probability: f64,
    pub expected_value_of_perfect_information: f64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub inputs: Vec<UncertaintyModelInputInformation>,
    pub recommended: UncertaintyModelInformationRecommended,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suggested_next_measurement: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelSensitivity {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub inputs: Vec<UncertaintyModelInputSensitivity>,
    pub output: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelInputInformation {
    pub expected_value_of_perfect_information: f64,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelInputSensitivity {
    pub name: String,
    pub rank_correlation: f64,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub scatter: Vec<UncertaintyModelScatterPoint>,
    pub share: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UncertaintyModelScatterPoint {
    pub input: f64,
    pub output: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum UncertaintyModelRunSummaryTrigger {
    #[serde(rename = "request")]
    Request,
    #[serde(rename = "source_changed")]
    SourceChanged,
}

impl UncertaintyModelRunSummaryTrigger {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Request => "request",
            Self::SourceChanged => "source_changed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum UncertaintyModelBoundInputState {
    #[serde(rename = "resolved")]
    Resolved,
    #[serde(rename = "source_missing")]
    SourceMissing,
    #[serde(rename = "value_missing")]
    ValueMissing,
}

impl UncertaintyModelBoundInputState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Resolved => "resolved",
            Self::SourceMissing => "source_missing",
            Self::ValueMissing => "value_missing",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum UncertaintyModelInformationRecommended {
    #[serde(rename = "act")]
    Act,
    #[serde(rename = "hold")]
    Hold,
}

impl UncertaintyModelInformationRecommended {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Act => "act",
            Self::Hold => "hold",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum UncertaintyModelSource {
    #[serde(rename = "all")]
    All,
    #[serde(rename = "admin")]
    Admin,
    #[serde(rename = "app")]
    App,
}

impl UncertaintyModelSource {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::All => "all",
            Self::Admin => "admin",
            Self::App => "app",
        }
    }
}

impl CustdClient {
    /// List the tenant's uncertainty models.
    pub fn list_uncertainty_models(
        &self,
        source: Option<UncertaintyModelSource>,
        company_slug: Option<&str>,
    ) -> Result<UncertaintyModelList> {
        let path = api_path(
            "/api/v1/admin/uncertainty-models".to_owned(),
            &[("source", source.map(|v| v.as_str().to_owned()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create an uncertainty model, with version 1 when quantities are given.
    pub fn create_uncertainty_model(
        &self,
        request: &UncertaintyModelCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<UncertaintyModelDetail> {
        let path = api_path(
            "/api/v1/admin/uncertainty-models".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get an uncertainty model with its latest version.
    pub fn get_uncertainty_model(
        &self,
        model_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<UncertaintyModelDetail> {
        let path = api_path(
            format!(
                "/api/v1/admin/uncertainty-models/{}",
                percent_encode(model_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Delete an uncertainty model with its versions and runs; an app item's model is deleted with its item.
    pub fn delete_uncertainty_model(
        &self,
        model_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/uncertainty-models/{}",
                percent_encode(model_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Copy one version of an uncertainty model into a new model.
    pub fn copy_uncertainty_model(
        &self,
        model_uuid: &str,
        request: &AppModelCopyRequest,
        company_slug: Option<&str>,
    ) -> Result<UncertaintyModelDetail> {
        let path = api_path(
            format!(
                "/api/v1/admin/uncertainty-models/{}/copy",
                percent_encode(model_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List an uncertainty model's versions, newest first.
    pub fn list_uncertainty_model_versions(
        &self,
        model_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<UncertaintyModelVersionList> {
        let path = api_path(
            format!(
                "/api/v1/admin/uncertainty-models/{}/versions",
                percent_encode(model_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Save a new immutable version of an uncertainty model.
    pub fn create_uncertainty_model_version(
        &self,
        model_uuid: &str,
        request: &UncertaintyModelVersionCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<UncertaintyModelVersion> {
        let path = api_path(
            format!(
                "/api/v1/admin/uncertainty-models/{}/versions",
                percent_encode(model_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get one version of an uncertainty model.
    pub fn get_uncertainty_model_version(
        &self,
        model_uuid: &str,
        version_number: i64,
        company_slug: Option<&str>,
    ) -> Result<UncertaintyModelVersion> {
        let path = api_path(
            format!(
                "/api/v1/admin/uncertainty-models/{}/versions/{}",
                percent_encode(model_uuid),
                version_number
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List an uncertainty model's runs.
    pub fn list_uncertainty_model_runs(&self, model_uuid: &str) -> Result<UncertaintyModelRunList> {
        let path = api_path(
            format!(
                "/api/v1/measurement/uncertainty-models/{}/runs",
                percent_encode(model_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Run an uncertainty model.
    pub fn create_uncertainty_model_run(
        &self,
        model_uuid: &str,
        request: &UncertaintyModelRunRequest,
    ) -> Result<UncertaintyModelRunDetail> {
        let path = api_path(
            format!(
                "/api/v1/measurement/uncertainty-models/{}/runs",
                percent_encode(model_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get an uncertainty model run.
    pub fn get_uncertainty_model_run(
        &self,
        model_uuid: &str,
        run_uuid: &str,
    ) -> Result<UncertaintyModelRunDetail> {
        let path = api_path(
            format!(
                "/api/v1/measurement/uncertainty-models/{}/runs/{}",
                percent_encode(model_uuid),
                percent_encode(run_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
