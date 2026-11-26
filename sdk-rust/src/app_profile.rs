//! The signed-in application member's own profile (`/api/v1/app/profile`). The client's bearer token is the
//! member's application access token with the profile grant, not an administrator's token.
//!
//! Request and response shapes follow the admin-api OpenAPI document.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::Method;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentApplicationProfile {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub fields: Vec<ApplicationProfileFieldState>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub managed_photo: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationProfileFieldState {
    pub editable: bool,
    pub editable_by: String,
    pub field_key: String,
    pub initialized: bool,
    pub present: bool,
    pub required: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationProfileValuesRequest {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub values: Vec<ApplicationProfileValue>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationProfileValue {
    pub field_key: String,
    pub value: String,
}

impl CustdClient {
    /// Read the signed-in application profile.
    pub fn get_current_app_profile(&self) -> Result<CurrentApplicationProfile> {
        let path = api_path("/api/v1/app/profile".to_owned(), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Edit the signed-in application's profile names.
    pub fn update_current_app_profile(
        &self,
        request: &ApplicationProfileValuesRequest,
    ) -> Result<CurrentApplicationProfile> {
        let path = api_path("/api/v1/app/profile".to_owned(), &[], None);
        self.call(Method::Patch, &path, Some(request))
    }

    /// Initialize absent profile names.
    pub fn initialize_current_app_profile(
        &self,
        request: &ApplicationProfileValuesRequest,
    ) -> Result<CurrentApplicationProfile> {
        let path = api_path("/api/v1/app/profile".to_owned(), &[], None);
        self.call(Method::Post, &path, Some(request))
    }

    /// Remove the signed-in user's photo.
    pub fn remove_current_app_profile_photo(&self) -> Result<CurrentApplicationProfile> {
        let path = api_path("/api/v1/app/profile/photo".to_owned(), &[], None);
        self.call(Method::Delete, &path, NO_BODY)
    }
}
