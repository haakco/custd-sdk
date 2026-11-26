//! Data labels (Admin API): definitions, values, usage, schema-field assignments and event-type
//! defaults.
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
pub struct DataLabelDefinitionListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub definitions: Vec<DataLabelDefinition>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelDefinition {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_scopes: Vec<String>,
    pub authority: String,
    pub created_at: String,
    pub description: String,
    pub display_name: String,
    pub enabled: bool,
    pub intended_use: String,
    pub key: String,
    pub propagation_policy: String,
    pub sensitivity: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub synonyms: Vec<String>,
    pub updated_at: String,
    pub uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub values: Vec<DataLabelValue>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelValue {
    pub created_at: String,
    pub description: String,
    pub display_name: String,
    pub enabled: bool,
    pub updated_at: String,
    pub uuid: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelDefinitionCreateRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_scopes: Vec<String>,
    pub description: String,
    pub display_name: String,
    pub intended_use: String,
    pub key: String,
    pub propagation_policy: DataLabelPropagationPolicy,
    pub sensitivity: DataLabelSensitivity,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub synonyms: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelDefinitionUpdateRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allowed_scopes: Vec<String>,
    pub description: String,
    pub display_name: String,
    pub intended_use: String,
    pub propagation_policy: DataLabelPropagationPolicy,
    pub sensitivity: DataLabelSensitivity,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub synonyms: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelCatalogueResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub assignments: Vec<DataLabelCatalogueAssignment>,
    pub catalogue: DescriptiveLabelCatalogue,
    pub fingerprint: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub reporting_packs: Vec<DataLabelCataloguePack>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelCatalogueAssignment {
    pub definition_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub event_type_slug: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub field_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub schema_uuid: Option<String>,
    pub scope: String,
    pub value_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DescriptiveLabelCatalogue {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub labels: Vec<DescriptiveLabel>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelCataloguePack {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub datasets: Vec<DataLabelCatalogueDataset>,
    pub display_name: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DescriptiveLabel {
    pub definition_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub display_name: String,
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub intended_use: Option<String>,
    pub key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sensitivity: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub synonyms: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelCatalogueDataset {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub definition_uuid: Option<String>,
    pub display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub value_uuids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelUsageListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub usage: Vec<DataLabelUsage>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelUsage {
    pub definition_uuid: String,
    pub event_type_defaults: i64,
    pub schema_field_assignments: i64,
    pub total: i64,
    pub value_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelValueCreateRequest {
    pub description: String,
    pub display_name: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelValueUpdateRequest {
    pub description: String,
    pub display_name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLabelAssignmentListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub event_type_defaults: Vec<EventTypeDataLabelDefault>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub schema_field_assignments: Vec<SchemaFieldDataLabelAssignment>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTypeDataLabelDefault {
    pub definition_uuid: String,
    pub event_type_slug: String,
    pub value_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaFieldDataLabelAssignment {
    pub assignment_uuid: String,
    pub definition_uuid: String,
    pub field_path: String,
    pub schema_uuid: String,
    pub value_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaFieldDataLabelAssignmentRequest {
    pub definition_uuid: String,
    pub field_path: String,
    pub value_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTypeDataLabelDefaultRequest {
    pub value_uuid: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DataLabelPropagationPolicy {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "event_type_to_event")]
    EventTypeToEvent,
    #[serde(rename = "pack_selected")]
    PackSelected,
}

impl DataLabelPropagationPolicy {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::EventTypeToEvent => "event_type_to_event",
            Self::PackSelected => "pack_selected",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DataLabelSensitivity {
    #[serde(rename = "public")]
    Public,
    #[serde(rename = "internal")]
    Internal,
    #[serde(rename = "personal")]
    Personal,
    #[serde(rename = "restricted")]
    Restricted,
}

impl DataLabelSensitivity {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Public => "public",
            Self::Internal => "internal",
            Self::Personal => "personal",
            Self::Restricted => "restricted",
        }
    }
}

impl CustdClient {
    /// List data labels.
    pub fn list_data_labels(
        &self,
        include_disabled: Option<bool>,
        company_slug: Option<&str>,
    ) -> Result<DataLabelDefinitionListResponse> {
        let path = api_path(
            "/api/v1/admin/data-labels".to_owned(),
            &[("includeDisabled", include_disabled.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create data label.
    pub fn create_data_label(
        &self,
        request: &DataLabelDefinitionCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataLabelDefinition> {
        let path = api_path("/api/v1/admin/data-labels".to_owned(), &[], company_slug);
        self.call(Method::Post, &path, Some(request))
    }

    /// Get data label.
    pub fn get_data_label(
        &self,
        definition_uuid: &str,
        include_disabled: Option<bool>,
        company_slug: Option<&str>,
    ) -> Result<DataLabelDefinition> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-labels/{}",
                percent_encode(definition_uuid)
            ),
            &[("includeDisabled", include_disabled.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Update data label metadata.
    pub fn update_data_label(
        &self,
        definition_uuid: &str,
        request: &DataLabelDefinitionUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataLabelDefinition> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-labels/{}",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Disable data label.
    pub fn disable_data_label(
        &self,
        definition_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-labels/{}/disable",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Get data-label catalogue.
    pub fn get_data_label_catalogue(
        &self,
        include_disabled: Option<bool>,
        company_slug: Option<&str>,
    ) -> Result<DataLabelCatalogueResponse> {
        let path = api_path(
            "/api/v1/admin/data-labels/catalogue".to_owned(),
            &[("includeDisabled", include_disabled.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List data-label usage.
    pub fn list_data_label_usage(
        &self,
        company_slug: Option<&str>,
    ) -> Result<DataLabelUsageListResponse> {
        let path = api_path(
            "/api/v1/admin/data-labels/usage".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create data-label value.
    pub fn create_data_label_value(
        &self,
        definition_uuid: &str,
        request: &DataLabelValueCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataLabelValue> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-labels/{}/values",
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Update data-label value.
    pub fn update_data_label_value(
        &self,
        value_uuid: &str,
        request: &DataLabelValueUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<DataLabelValue> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-label-values/{}",
                percent_encode(value_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Patch, &path, Some(request))
    }

    /// Disable data-label value.
    pub fn disable_data_label_value(
        &self,
        value_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-label-values/{}/disable",
                percent_encode(value_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// List data-label assignments.
    pub fn list_data_label_assignments(
        &self,
        company_slug: Option<&str>,
    ) -> Result<DataLabelAssignmentListResponse> {
        let path = api_path(
            "/api/v1/admin/data-label-assignments".to_owned(),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Set schema-field data label.
    pub fn set_schema_field_data_label_assignment(
        &self,
        schema_uuid: &str,
        request: &SchemaFieldDataLabelAssignmentRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/event-schemas/{}/field-data-labels",
                percent_encode(schema_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Remove schema-field data label.
    pub fn remove_schema_field_data_label_assignment(
        &self,
        assignment_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/data-label-assignments/schema-fields/{}",
                percent_encode(assignment_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Set event-type data-label default.
    pub fn set_event_type_data_label_default(
        &self,
        slug: &str,
        definition_uuid: &str,
        request: &EventTypeDataLabelDefaultRequest,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/event-types/{}/data-label-defaults/{}",
                percent_encode(slug),
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Remove event-type data-label default.
    pub fn remove_event_type_data_label_default(
        &self,
        slug: &str,
        definition_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "/api/v1/admin/event-types/{}/data-label-defaults/{}",
                percent_encode(slug),
                percent_encode(definition_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }
}
