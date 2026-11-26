//! Machine access policy (Admin API `/api/v1/admin/machine-access`): what a company's machine
//! credentials (OAuth clients) may do, per feature area.
//!
//! The policy only narrows: an allowed area still needs the client's own scopes. A blocked call is
//! refused with [`crate::Error::Api`] whose problem code is [`MACHINE_ACCESS_BLOCKED_CODE`] and whose
//! [`crate::ApiError::machine_access`] names the area and the setting that blocked it. Area, state
//! and decided-by values are open sets; the constants name the ones Custd sends today.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

/// A machine access setting refused the request.
pub const MACHINE_ACCESS_BLOCKED_CODE: &str = "machine_access_blocked";
/// The machine access policy could not be read; the gate fails closed and the call may be retried.
pub const MACHINE_ACCESS_UNAVAILABLE_CODE: &str = "machine_access_unavailable";

pub const MACHINE_ACCESS_AREA_SITES: &str = "sites";
pub const MACHINE_ACCESS_AREA_REPORTING: &str = "reporting";
pub const MACHINE_ACCESS_AREA_PRIVACY_ERASURE: &str = "privacy_erasure";
pub const MACHINE_ACCESS_AREA_DESTRUCTIVE_JOBS: &str = "destructive_jobs";
pub const MACHINE_ACCESS_AREA_USERS_ACCESS: &str = "users_access";
pub const MACHINE_ACCESS_AREA_PROVISIONING_CREDENTIALS: &str = "provisioning_credentials";
pub const MACHINE_ACCESS_AREA_INGEST_SCHEMAS: &str = "ingest_schemas";
pub const MACHINE_ACCESS_AREA_USAGE_BILLING: &str = "usage_billing";

pub const MACHINE_ACCESS_ALLOWED: &str = "allowed";
pub const MACHINE_ACCESS_BLOCKED: &str = "blocked";
/// A machine override that defers to the company setting.
pub const MACHINE_ACCESS_INHERIT: &str = "inherit";

pub const MACHINE_ACCESS_DECIDED_BY_COMPANY: &str = "company";
pub const MACHINE_ACCESS_DECIDED_BY_MACHINE: &str = "machine";
/// The target company's "Allow Custd support automation" setting, which binds Custd's platform machine.
pub const MACHINE_ACCESS_DECIDED_BY_SUPPORT_AUTOMATION: &str = "support_automation";

/// Why a machine access setting refused a request: the area, which setting blocked it, and the
/// company and client it applied to.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessBlock {
    #[serde(default)]
    pub area: String,
    #[serde(default)]
    pub blocked_by: String,
    #[serde(default)]
    pub company_slug: String,
    #[serde(default)]
    pub client_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessAreaSetting {
    pub area: String,
    pub state: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessCompanyPolicy {
    pub company_slug: String,
    pub allow_support_automation: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub areas: Vec<MachineAccessAreaSetting>,
}

/// A change to the company policy. An unset member is not sent and leaves that setting as it
/// is, so setting areas alone never changes support automation.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessCompanyUpdateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allow_support_automation: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub areas: Option<Vec<MachineAccessAreaSetting>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessMachinePolicy {
    pub company_slug: String,
    pub client_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub areas: Vec<MachineAccessAreaSetting>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessMachineUpdateRequest {
    pub areas: Vec<MachineAccessAreaSetting>,
}

/// What a machine can do in one area and which setting decided it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessEffectiveArea {
    pub area: String,
    pub allowed: bool,
    pub decided_by: String,
    pub company_state: String,
    pub machine_state: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineAccessEffective {
    pub company_slug: String,
    pub client_id: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub scopes: Vec<String>,
    pub allowed_areas: i64,
    pub total_areas: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub areas: Vec<MachineAccessEffectiveArea>,
}

const MACHINE_ACCESS_PATH: &str = "/api/v1/admin/machine-access";

/// A tenant administrator manages its own company; platform authority names it with
/// `company_slug`. The per-machine calls resolve the company from the client.
impl CustdClient {
    /// The company default for every area and whether Custd support automation may act in it.
    pub fn get_machine_access(
        &self,
        company_slug: Option<&str>,
    ) -> Result<MachineAccessCompanyPolicy> {
        let path = api_path(MACHINE_ACCESS_PATH.to_owned(), &[], company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn update_machine_access(
        &self,
        request: &MachineAccessCompanyUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<MachineAccessCompanyPolicy> {
        let path = api_path(MACHINE_ACCESS_PATH.to_owned(), &[], company_slug);
        self.call(Method::Put, &path, Some(request))
    }

    /// One machine's own per-area override.
    pub fn get_machine_access_override(
        &self,
        client_id: &str,
    ) -> Result<MachineAccessMachinePolicy> {
        self.call(Method::Get, &client_path(client_id, ""), NO_BODY)
    }

    pub fn update_machine_access_override(
        &self,
        client_id: &str,
        request: &MachineAccessMachineUpdateRequest,
    ) -> Result<MachineAccessMachinePolicy> {
        self.call(Method::Put, &client_path(client_id, ""), Some(request))
    }

    /// What the machine can do in each area, and which setting decided it.
    pub fn get_effective_machine_access(&self, client_id: &str) -> Result<MachineAccessEffective> {
        self.call(Method::Get, &client_path(client_id, "/effective"), NO_BODY)
    }
}

fn client_path(client_id: &str, suffix: &str) -> String {
    format!(
        "{MACHINE_ACCESS_PATH}/clients/{}{suffix}",
        percent_encode(client_id)
    )
}
