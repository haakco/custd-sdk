//! More hosted-app item routes: item settings, measurement and run pages, project runs, model copies,
//! model versions and model calculations, plus the alert email unsubscribe token.
//!
//! Request and response shapes follow the Admin and Analytics API OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::app::{AppItemCreated, AppItemRead, AppLink, ITEM_PATH, MODEL_RUNS_PATH, NO_BODY};
use crate::app_models::AppModelQuantityResult;
use crate::measurement::null_as_empty;
use crate::transport::Method;

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemSettingsRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub idle_expiry_seconds: Option<i64>,
    /// Collection name. Empty clears it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project: Option<AppItemProjectUpdateRequest>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemProjectUpdateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub definition_of_done: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub delivery_target_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub forecast_method: Option<AppItemProjectUpdateRequestForecastMethod>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub run_similar: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemMeasurementPage {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<AppItemMeasurement>,
    pub run_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemMeasurement {
    pub observation_uuid: String,
    pub observed_at: String,
    pub series_uuid: String,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemRunPage {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub runs: Vec<AppItemRun>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemRun {
    pub created_at: String,
    pub name: String,
    pub run_uuid: String,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemRunCreateRequest {
    /// Defaults to the source project's name.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub project_code: String,
    /// Deadline for the new run's target.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_date: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelCopyRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version_number: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelVersionRequest {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub counter_links: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub quantities: Vec<AppItemQuantity>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemQuantity {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub formula: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub input: Option<AppItemInput>,
    pub kind: AppItemQuantityKind,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemInput {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub distribution: Option<AppItemInputDistribution>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub high: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub low: Option<f64>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub samples: Vec<f64>,
    pub shape: AppItemInputShape,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<AppItemInputSource>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub successes: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trials: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemInputSource {
    pub field: AppItemInputSourceField,
    pub kind: AppItemInputSourceKind,
    pub project_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelCalculateRequest {
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub inputs: Vec<AppModelInputOverride>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub outputs: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sample_count: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version_number: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelCalculateResult {
    pub model_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub quantities: Vec<AppModelQuantityResult>,
    pub sample_count: i64,
    pub seed: i64,
    pub version_number: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppModelInputOverride {
    pub input: AppItemInput,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppAlertUnsubscribeRequest {
    pub token: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemProjectUpdateRequestForecastMethod {
    #[serde(rename = "bootstrap_quantile")]
    BootstrapQuantile,
    #[serde(rename = "bayesian_linear_regression")]
    BayesianLinearRegression,
    #[serde(rename = "seasonal_7_day")]
    Seasonal7Day,
}

impl AppItemProjectUpdateRequestForecastMethod {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::BootstrapQuantile => "bootstrap_quantile",
            Self::BayesianLinearRegression => "bayesian_linear_regression",
            Self::Seasonal7Day => "seasonal_7_day",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemQuantityKind {
    #[serde(rename = "input")]
    Input,
    #[serde(rename = "formula")]
    Formula,
}

impl AppItemQuantityKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Input => "input",
            Self::Formula => "formula",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemInputDistribution {
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "lognormal")]
    Lognormal,
    #[serde(rename = "uniform")]
    Uniform,
}

impl AppItemInputDistribution {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Normal => "normal",
            Self::Lognormal => "lognormal",
            Self::Uniform => "uniform",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemInputShape {
    #[serde(rename = "point")]
    Point,
    #[serde(rename = "range")]
    Range,
    #[serde(rename = "proportion")]
    Proportion,
    #[serde(rename = "samples")]
    Samples,
    #[serde(rename = "bound")]
    Bound,
}

impl AppItemInputShape {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Point => "point",
            Self::Range => "range",
            Self::Proportion => "proportion",
            Self::Samples => "samples",
            Self::Bound => "bound",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemInputSourceField {
    #[serde(rename = "completion_days")]
    CompletionDays,
    #[serde(rename = "deadline_probability")]
    DeadlineProbability,
    #[serde(rename = "rate_per_day")]
    RatePerDay,
}

impl AppItemInputSourceField {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::CompletionDays => "completion_days",
            Self::DeadlineProbability => "deadline_probability",
            Self::RatePerDay => "rate_per_day",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppItemInputSourceKind {
    #[serde(rename = "counter_forecast")]
    CounterForecast,
}

impl AppItemInputSourceKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::CounterForecast => "counter_forecast",
        }
    }
}

impl AppLink<'_> {
    /// Change an item's idle window and project settings.
    pub fn update(&self, request: &AppItemSettingsRequest) -> Result<AppItemRead> {
        let path = ITEM_PATH.to_owned();
        self.query_call(Method::Patch, &path, &[], Some(request))
    }

    /// Page through a run's measurements in observed time order.
    pub fn list_measurements(
        &self,
        item: Option<&str>,
        after: Option<&str>,
        limit: Option<i64>,
        run: Option<&str>,
    ) -> Result<AppItemMeasurementPage> {
        let path = format!("{ITEM_PATH}/measurements");
        self.query_call(
            Method::Get,
            &path,
            &[
                ("item", item.map(str::to_owned)),
                ("after", after.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
                ("run", run.map(str::to_owned)),
            ],
            NO_BODY,
        )
    }

    /// Page through measurement runs.
    pub fn list_runs(
        &self,
        item: Option<&str>,
        after: Option<&str>,
        limit: Option<i64>,
    ) -> Result<AppItemRunPage> {
        let path = format!("{ITEM_PATH}/runs");
        self.query_call(
            Method::Get,
            &path,
            &[
                ("item", item.map(str::to_owned)),
                ("after", after.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
            ],
            NO_BODY,
        )
    }

    /// Start a new measurement run.
    pub fn start_run(&self, request: &AppItemRunCreateRequest) -> Result<AppItemRead> {
        let path = format!("{ITEM_PATH}/runs");
        self.query_call(Method::Post, &path, &[], Some(request))
    }

    /// Copy a model version into a new item with its own links.
    pub fn copy_model(&self, request: &AppModelCopyRequest) -> Result<AppItemCreated> {
        let path = format!("{ITEM_PATH}/model/copy");
        self.query_call(Method::Post, &path, &[], Some(request))
    }

    /// Save a new version of a model's quantities.
    pub fn add_model_version(&self, request: &AppModelVersionRequest) -> Result<AppItemRead> {
        let path = format!("{ITEM_PATH}/model/versions");
        self.query_call(Method::Post, &path, &[], Some(request))
    }

    /// Calculate the item's uncertainty model with input overrides, without storing a run.
    pub fn calculate_model(
        &self,
        request: &AppModelCalculateRequest,
    ) -> Result<AppModelCalculateResult> {
        let path = format!("{MODEL_RUNS_PATH}/calculate");
        self.query_call(Method::Post, &path, &[], Some(request))
    }
}
