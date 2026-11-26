//! Measurement project changes beyond create and observe (Admin API): update, cancel, series,
//! targets, runs, imports, calibration exercises and decision models.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::app_item_runs::{AppItemProjectUpdateRequest, AppItemRunCreateRequest};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::measurement::{MeasurementObservationResult, MeasurementProject};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSeriesCreateRequest {
    pub completion_direction: String,
    pub name: String,
    pub series_code: String,
    pub source: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit_label: Option<String>,
    pub unit_slug: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSeriesResponse {
    pub completion_direction: String,
    pub name: String,
    pub series_code: String,
    pub series_uuid: String,
    pub source: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit_label: Option<String>,
    pub unit_slug: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementTargetCreateRequest {
    pub name: String,
    pub state: String,
    pub target_code: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_date: Option<String>,
    pub target_value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementTargetResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    pub name: String,
    pub state: String,
    pub target_code: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_date: Option<String>,
    pub target_uuid: String,
    pub target_value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementImportRunResponse {
    pub accepted: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    pub created_at: String,
    pub import_id: String,
    pub project_code: String,
    pub rejected: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub results: Vec<MeasurementObservationResult>,
    pub row_count: i64,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementCalibrationExerciseCreateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub actual_value: Option<f64>,
    pub confidence: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contained: Option<bool>,
    pub lower_bound: f64,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub metadata: BTreeMap<String, Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prior_uuid: Option<String>,
    pub question: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    pub upper_bound: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementCalibrationExerciseResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub actual_value: Option<f64>,
    pub confidence: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contained: Option<bool>,
    pub created_at: String,
    pub exercise_uuid: String,
    pub lower_bound: f64,
    pub project_code: String,
    pub question: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    pub status: String,
    pub updated_at: String,
    pub upper_bound: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionModelListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub decisions: Vec<MeasurementDecisionModelResponse>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionModelResponse {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub choices: Vec<MeasurementDecisionChoiceResponse>,
    pub created_at: String,
    pub decision_code: String,
    pub decision_uuid: String,
    pub description: String,
    pub name: String,
    pub objective: String,
    pub project_code: String,
    pub status: String,
    pub updated_at: String,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub variables: Vec<MeasurementDecisionVariableResponse>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionChoiceResponse {
    pub choice_code: String,
    pub choice_uuid: String,
    pub description: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expression: Option<MeasurementDecisionExpression>,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionVariableResponse {
    pub distribution_slug: String,
    pub measurement_cost: f64,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parameters: Option<MeasurementDecisionDistributionParameters>,
    pub unit_slug: String,
    pub variable_code: String,
    pub variable_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionExpression {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub children: Vec<MeasurementDecisionExpression>,
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variable_code: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionDistributionParameters {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mean: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub min: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mode: Option<f64>,
    #[serde(rename = "std-dev", default, skip_serializing_if = "Option::is_none")]
    pub std_dev: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionModelCreateRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub choices: Vec<MeasurementDecisionChoiceRequest>,
    pub decision_code: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub objective: Option<String>,
    pub status: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub variables: Vec<MeasurementDecisionVariableRequest>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionChoiceRequest {
    pub choice_code: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub expression: MeasurementDecisionExpression,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionVariableRequest {
    pub distribution_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub measurement_cost: Option<f64>,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parameters: Option<MeasurementDecisionDistributionParameters>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit_slug: Option<String>,
    pub variable_code: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementDecisionModelUpdateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub objective: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

impl CustdClient {
    /// Update a measurement project.
    pub fn update_measurement_project(
        &self,
        project_uuid: &str,
        request: &AppItemProjectUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementProject> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Cancel a measurement project.
    pub fn cancel_measurement_project(
        &self,
        project_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementProject> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/cancel",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Create measurement series.
    pub fn create_measurement_series(
        &self,
        project_uuid: &str,
        request: &MeasurementSeriesCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementSeriesResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/series",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Create a measurement target.
    pub fn create_measurement_target(
        &self,
        project_uuid: &str,
        request: &MeasurementTargetCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementTargetResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/targets",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Reopen a met measurement target.
    pub fn reopen_measurement_target(
        &self,
        project_uuid: &str,
        target_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementTargetResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/targets/{}/reopen",
                percent_encode(project_uuid),
                percent_encode(target_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Start a new run of a measurement project.
    pub fn create_measurement_run(
        &self,
        project_uuid: &str,
        request: &AppItemRunCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementProject> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/runs",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a measurement import.
    pub fn get_measurement_import(
        &self,
        project_uuid: &str,
        import_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementImportRunResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/imports/{}",
                percent_encode(project_uuid),
                percent_encode(import_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a measurement calibration exercise.
    pub fn create_measurement_calibration_exercise(
        &self,
        project_uuid: &str,
        request: &MeasurementCalibrationExerciseCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementCalibrationExerciseResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/calibration-exercises",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// List measurement decision models.
    pub fn list_measurement_decision_models(
        &self,
        project_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementDecisionModelListResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/decisions",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a measurement decision model.
    pub fn create_measurement_decision_model(
        &self,
        project_uuid: &str,
        request: &MeasurementDecisionModelCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementDecisionModelResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/decisions",
                percent_encode(project_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get a measurement decision model.
    pub fn get_measurement_decision_model(
        &self,
        project_uuid: &str,
        decision_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<MeasurementDecisionModelResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/decisions/{}",
                percent_encode(project_uuid),
                percent_encode(decision_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update a measurement decision model.
    pub fn update_measurement_decision_model(
        &self,
        project_uuid: &str,
        decision_uuid: &str,
        request: &MeasurementDecisionModelUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<MeasurementDecisionModelResponse> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/decisions/{}",
                percent_encode(project_uuid),
                percent_encode(decision_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Archive a measurement decision model.
    pub fn archive_measurement_decision_model(
        &self,
        project_uuid: &str,
        decision_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/measurement/projects/{}/decisions/{}",
                percent_encode(project_uuid),
                percent_encode(decision_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }
}
