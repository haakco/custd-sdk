//! Hosted-app item routes under `/api/v1/app/`: no login, the app's Site key plus a link token.
//!
//! Items live in the Admin API (`/api/v1/app/items`, `/api/v1/app/item`) and their forecasts in
//! the Analytics API (`/api/v1/app/forecast`). An owner link reads and changes its one item; a
//! share link only reads it. Reads carry an ETag, and a matching `If-None-Match` answers
//! [`Conditional::NotModified`].

use std::fmt;
use std::sync::Arc;

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

use crate::Result;
use crate::client::{decode, execute, json_request, trim_base_url};
use crate::measurement::{
    MeasurementForecastRun, MeasurementForecastRunRequest, MeasurementObservationBulk,
    MeasurementObservationCsv, MeasurementObservationImport, MeasurementProject,
    MeasurementSeriesCreate, MeasurementTargetCreate, ProjectComplete, ProjectEstimate,
    ProjectEstimateCreate, ProjectEstimateList, null_as_empty, validate_import,
};
use crate::transport::{Method, Transport, UreqTransport, percent_encode};

pub const APP_ITEM_KIND_MEASUREMENT_PROJECT: &str = "measurement_project";
pub const APP_ITEM_KIND_LINK_COLLECTION: &str = "link_collection";

const ITEMS_PATH: &str = "/api/v1/app/items";
const ITEM_PATH: &str = "/api/v1/app/item";
const FORECAST_PATH: &str = "/api/v1/app/forecast";
const SITE_KEY_HEADER: &str = "X-Custd-Site-Key";
const NO_BODY: Option<&()> = None;

/// A hosted app's view of Custd: its API origin, its Site key, and one of its allowed origins.
#[derive(Clone)]
pub struct AppClient {
    base_url: String,
    site_key: String,
    origin: String,
    pub(crate) transport: Arc<dyn Transport>,
}

/// One link token presented to the item routes.
#[derive(Clone)]
pub struct AppLink<'a> {
    app: &'a AppClient,
    token: String,
}

/// A read that may be answered from the caller's copy.
#[derive(Debug, Clone)]
pub enum Conditional<T> {
    Modified { etag: Option<String>, value: T },
    NotModified,
}

/// Options for a read: `item` reads one entry of a presented link collection; `if_none_match`
/// is the ETag of the last read.
#[derive(Debug, Clone, Default)]
pub struct AppReadOptions {
    pub item: Option<String>,
    pub if_none_match: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemCreate {
    /// [`APP_ITEM_KIND_MEASUREMENT_PROJECT`] or [`APP_ITEM_KIND_LINK_COLLECTION`].
    pub kind: String,
    /// How long the item may go unchanged before it is deleted; default 7 days.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idle_expiry_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub measurement_project: Option<AppMeasurementProjectCreate>,
}

/// The project a measurement item wraps. Custd chooses its project code.
#[derive(Debug, Clone, Serialize)]
pub struct AppMeasurementProjectCreate {
    pub kind: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub series: Vec<MeasurementSeriesCreate>,
    pub target: MeasurementTargetCreate,
}

/// A new item and its two link tokens, each shown only this once.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemCreated {
    pub item: AppItemRead,
    pub owner_token: String,
    pub share_token: String,
}

/// An item with its kind's content. Links are listed for an owner link only.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemRead {
    pub item: AppItem,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub links: Vec<AppItemLink>,
    pub measurement_project: Option<MeasurementProject>,
    pub estimates: Option<ProjectEstimateList>,
    pub link_collection: Option<AppLinkCollection>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItem {
    pub item_uuid: String,
    pub kind: String,
    /// `owner` or `share`: what the presented link may do.
    pub role: String,
    pub version: i64,
    pub idle_expiry_seconds: i64,
    pub updated_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemLink {
    pub link_uuid: String,
    pub role: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AppLinkCollection {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub entries: Vec<AppLinkCollectionEntry>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppLinkCollectionEntry {
    pub entry_uuid: String,
    pub item_uuid: String,
    pub kind: String,
    pub position: i64,
    pub created_at: String,
}

/// A link with its new token, shown only this once.
#[derive(Clone, Deserialize)]
pub struct AppItemLinkRotated {
    pub link: AppItemLink,
    pub token: String,
}

#[derive(Serialize)]
struct AppLinkCollectionEntryAdd<'a> {
    token: &'a str,
}

impl AppClient {
    pub fn new(
        base_url: impl Into<String>,
        site_key: impl Into<String>,
        origin: impl Into<String>,
    ) -> Self {
        Self {
            base_url: trim_base_url(base_url.into()),
            site_key: site_key.into(),
            origin: origin.into(),
            transport: Arc::new(UreqTransport::new()),
        }
    }

    /// Creates an item with its owner and share links.
    pub fn create_item(&self, request: &AppItemCreate) -> Result<AppItemCreated> {
        self.send(
            Method::Post,
            ITEMS_PATH.to_owned(),
            None,
            Some(request),
            None,
        )
        .and_then(|response| decode(&response.body))
    }

    /// The item routes for one link token.
    pub fn link(&self, token: impl Into<String>) -> AppLink<'_> {
        AppLink {
            app: self,
            token: token.into(),
        }
    }

    fn send(
        &self,
        method: Method,
        path: String,
        token: Option<&str>,
        body: Option<&impl Serialize>,
        if_none_match: Option<&str>,
    ) -> Result<crate::transport::HttpResponse> {
        let mut headers = vec![
            (SITE_KEY_HEADER, self.site_key.clone()),
            ("Origin", self.origin.clone()),
        ];
        if let Some(token) = token {
            headers.push(("Authorization", format!("Bearer {token}")));
        }
        if let Some(etag) = if_none_match {
            headers.push(("If-None-Match", etag.to_owned()));
        }
        let request = json_request(method, format!("{}{path}", self.base_url), headers, body)?;
        execute(self.transport.as_ref(), &request)
    }
}

impl AppLink<'_> {
    pub fn read(&self, options: &AppReadOptions) -> Result<Conditional<AppItemRead>> {
        self.read_conditional(ITEM_PATH, options)
    }

    /// Adds measurements, one or in bulk, and checks every row's result.
    pub fn add_measurements(
        &self,
        request: &MeasurementObservationBulk,
    ) -> Result<MeasurementObservationImport> {
        let import = self.write(Method::Post, "/measurements", Some(request))?;
        validate_import(import, request.rows.len())
    }

    /// Adds measurements from CSV text; `expected_rows` is the number of data rows sent.
    pub fn import_measurements_csv(
        &self,
        csv: &str,
        expected_rows: usize,
    ) -> Result<MeasurementObservationImport> {
        let import = self.write(
            Method::Post,
            "/measurements/csv",
            Some(&MeasurementObservationCsv { csv }),
        )?;
        validate_import(import, expected_rows)
    }

    pub fn create_estimate(&self, request: &ProjectEstimateCreate) -> Result<ProjectEstimate> {
        self.write(Method::Post, "/estimates", Some(request))
    }

    pub fn complete(&self, request: &ProjectComplete) -> Result<AppItemRead> {
        self.write(Method::Post, "/complete", Some(request))
    }

    pub fn cancel(&self) -> Result<AppItemRead> {
        self.write(Method::Post, "/cancel", NO_BODY)
    }

    /// Reopens a counter whose target was met.
    pub fn reopen(&self) -> Result<AppItemRead> {
        self.write(Method::Post, "/reopen", NO_BODY)
    }

    /// Adds the item another link opens to this link collection.
    pub fn add_entry(&self, token: &str) -> Result<AppLinkCollectionEntry> {
        self.write(
            Method::Post,
            "/entries",
            Some(&AppLinkCollectionEntryAdd { token }),
        )
    }

    pub fn remove_entry(&self, entry_uuid: &str) -> Result<()> {
        self.write(
            Method::Delete,
            &format!("/entries/{}", percent_encode(entry_uuid)),
            NO_BODY,
        )
    }

    pub fn revoke_link(&self, link_uuid: &str) -> Result<()> {
        self.write(
            Method::Delete,
            &format!("/links/{}", percent_encode(link_uuid)),
            NO_BODY,
        )
    }

    pub fn rotate_link(&self, link_uuid: &str) -> Result<AppItemLinkRotated> {
        let suffix = format!("/links/{}/rotate", percent_encode(link_uuid));
        self.write(Method::Post, &suffix, NO_BODY)
    }

    /// Runs the item's forecast; owner links only.
    pub fn run_forecast(
        &self,
        request: &MeasurementForecastRunRequest,
    ) -> Result<MeasurementForecastRun> {
        let path = format!("{FORECAST_PATH}/runs");
        let response = self
            .app
            .send(Method::Post, path, Some(&self.token), Some(request), None)?;
        decode(&response.body)
    }

    pub fn latest_forecast(
        &self,
        options: &AppReadOptions,
    ) -> Result<Conditional<MeasurementForecastRun>> {
        self.read_conditional(&format!("{FORECAST_PATH}/latest"), options)
    }

    pub fn forecast_run(
        &self,
        run_uuid: &str,
        options: &AppReadOptions,
    ) -> Result<Conditional<MeasurementForecastRun>> {
        let path = format!("{FORECAST_PATH}/runs/{}", percent_encode(run_uuid));
        self.read_conditional(&path, options)
    }

    fn write<T: DeserializeOwned>(
        &self,
        method: Method,
        suffix: &str,
        body: Option<&impl Serialize>,
    ) -> Result<T> {
        let path = format!("{ITEM_PATH}{suffix}");
        let response = self.app.send(method, path, Some(&self.token), body, None)?;
        decode(&response.body)
    }

    fn read_conditional<T: DeserializeOwned>(
        &self,
        path: &str,
        options: &AppReadOptions,
    ) -> Result<Conditional<T>> {
        let path = match &options.item {
            Some(item) => format!("{path}?item={}", percent_encode(item)),
            None => path.to_owned(),
        };
        let if_none_match = options.if_none_match.as_deref();
        let response =
            self.app
                .send(Method::Get, path, Some(&self.token), NO_BODY, if_none_match)?;
        if response.status == 304 {
            return Ok(Conditional::NotModified);
        }
        Ok(Conditional::Modified {
            etag: response.etag,
            value: decode(&response.body)?,
        })
    }
}

impl fmt::Debug for AppClient {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AppClient")
            .field("base_url", &self.base_url)
            .field("site_key", &self.site_key)
            .field("origin", &self.origin)
            .finish()
    }
}

impl fmt::Debug for AppLink<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AppLink")
            .field("token", &"<redacted>")
            .finish()
    }
}

impl fmt::Debug for AppItemCreated {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AppItemCreated")
            .field("item", &self.item)
            .field("owner_token", &"<redacted>")
            .field("share_token", &"<redacted>")
            .finish()
    }
}

impl fmt::Debug for AppItemLinkRotated {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AppItemLinkRotated")
            .field("link", &self.link)
            .field("token", &"<redacted>")
            .finish()
    }
}
