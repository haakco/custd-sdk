//! Rows for the surface conformance test, one file per SDK module.

mod admin_actions;
mod admin_apps;
mod admin_sites;
mod admin_users;
mod analytics_events;
mod analytics_reads;
mod app_item_runs;
mod app_profile;
mod audit_accounting;
mod auth_project_directories;
mod auth_project_domains;
mod auth_project_releases;
mod auth_projects;
mod campaign_email;
mod data_labels;
mod data_scopes;
mod data_spaces;
mod error_issues;
mod event_types;
mod hand_written;
mod ingest;
mod measurement_predictions;
mod measurement_projects;
mod measurement_reads;
mod notifications;
mod oauth_clients;
mod offboarding;
mod privacy;
mod producers;
mod reporting;
mod reporting_packs;
mod retention;
mod schema_registry;
mod site_analytics;
mod site_domains;
mod site_findings;
mod site_insights_admin;
mod site_keywords;
mod site_monitors;
mod site_pages;
mod site_reports;
mod site_search;
mod site_web_data;
mod storage_usage;
mod subject_exports;
mod support_access;
mod system_operations;
mod tenant_manifest;
mod tenant_storage;
mod tenants;
mod time_plans;
mod uncertainty_models;
mod workflow_timings;

use serde::Serialize;
use serde::de::{DeserializeOwned, Error};
use serde_json::Value;

use crate::Row;

/// A request body from JSON holding the required fields only.
pub fn body<T: DeserializeOwned>(json: &str) -> T {
    serde_json::from_str(json).unwrap()
}

/// Decodes an example and encodes it again: every field the example sets must survive, so a
/// misspelt optional field fails here instead of silently decoding as `None`.
pub fn round_trip<T: DeserializeOwned + Serialize>(value: &Value) -> Result<(), serde_json::Error> {
    let encoded = serde_json::to_value(T::deserialize(value)?)?;
    if set_fields(value) == set_fields(&encoded) {
        Ok(())
    } else {
        Err(serde_json::Error::custom(format!(
            "round trip changed {value} into {encoded}"
        )))
    }
}

/// The value without nulls (fields or list items), empty lists or `$schema`, which mean the same
/// as absent.
fn set_fields(value: &Value) -> Value {
    match value {
        Value::Object(fields) => Value::Object(
            fields
                .iter()
                .filter(|(name, _)| *name != "$schema")
                .map(|(name, value)| (name.clone(), set_fields(value)))
                .filter(|(_, value)| !is_unset(value))
                .collect(),
        ),
        Value::Array(items) => Value::Array(
            items
                .iter()
                .filter(|item| !item.is_null())
                .map(set_fields)
                .collect(),
        ),
        other => other.clone(),
    }
}

fn is_unset(value: &Value) -> bool {
    value.is_null() || value.as_array().is_some_and(Vec::is_empty)
}

/// Every site-domain row.
pub fn site_rows() -> Vec<Row> {
    let mut rows = Vec::new();
    rows.extend(site_domains::rows());
    rows.extend(site_findings::rows());
    rows.extend(site_monitors::rows());
    rows.extend(site_pages::rows());
    rows.extend(site_search::rows());
    rows.extend(site_keywords::rows());
    rows.extend(site_web_data::rows());
    rows.extend(site_reports::rows());
    rows.extend(site_analytics::rows());
    rows
}

/// Every admin, app-profile, app-item and public row outside the site domains.
pub fn admin_rows() -> Vec<Row> {
    let mut rows = Vec::new();
    rows.extend(admin_apps::rows());
    rows.extend(auth_projects::rows());
    rows.extend(auth_project_domains::rows());
    rows.extend(app_profile::rows());
    rows.extend(auth_project_directories::rows());
    rows.extend(auth_project_releases::rows());
    rows.extend(producers::rows());
    rows.extend(data_spaces::rows());
    rows.extend(tenant_storage::rows());
    rows.extend(admin_sites::rows());
    rows.extend(app_item_runs::rows());
    rows.extend(hand_written::rows());
    rows
}

/// Every measurement, time-plan, workflow-timing, uncertainty-model, reporting and event-query row.
pub fn measurement_and_reporting_rows() -> Vec<Row> {
    let mut rows = Vec::new();
    rows.extend(measurement_predictions::rows());
    rows.extend(measurement_projects::rows());
    rows.extend(time_plans::rows());
    rows.extend(workflow_timings::rows());
    rows.extend(uncertainty_models::rows());
    rows.extend(reporting::rows());
    rows.extend(reporting_packs::rows());
    rows.extend(analytics_events::rows());
    rows.extend(measurement_reads::rows());
    rows.extend(analytics_reads::rows());
    rows
}

/// Every tenant, user, operations, privacy, offboarding, data-governance and notification row.
pub fn platform_admin_rows() -> Vec<Row> {
    let mut rows = Vec::new();
    rows.extend(tenants::rows());
    rows.extend(admin_users::rows());
    rows.extend(oauth_clients::rows());
    rows.extend(support_access::rows());
    rows.extend(system_operations::rows());
    rows.extend(storage_usage::rows());
    rows.extend(audit_accounting::rows());
    rows.extend(privacy::rows());
    rows.extend(retention::rows());
    rows.extend(offboarding::rows());
    rows.extend(subject_exports::rows());
    rows.extend(data_labels::rows());
    rows.extend(data_scopes::rows());
    rows.extend(event_types::rows());
    rows.extend(campaign_email::rows());
    rows.extend(notifications::rows());
    rows.extend(error_issues::rows());
    rows.extend(site_insights_admin::rows());
    rows.extend(tenant_manifest::rows());
    rows.extend(admin_actions::rows());
    rows
}

/// Every ingest-api and schema-registry row.
pub fn ingest_rows() -> Vec<Row> {
    let mut rows = schema_registry::rows();
    rows.extend(ingest::rows());
    rows
}
