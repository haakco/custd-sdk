//! Hosted-app item routes under `/api/v1/app/`: the app's Site key plus a link token, the
//! signed-in user's access token, or both.
//!
//! Items live in the Admin API (`/api/v1/app/items`, `/api/v1/app/item`) and their forecasts in
//! the Analytics API (`/api/v1/app/forecast`). An owner link reads and changes its one item; a
//! share link only reads it. A signed-in owner reaches their items with no link
//! ([`AppClient::owned_item`]). Reads carry an ETag, and a matching `If-None-Match` answers
//! [`Conditional::NotModified`].

use std::fmt;
use std::sync::Arc;

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

use crate::Result;
use crate::app_meetings::AppMeeting;
use crate::app_story::AppForecastStory;
use crate::client::{decode, execute, json_request, trim_base_url};
use crate::discovery::HostedAppDiscovery;
use crate::measurement::{
    MeasurementForecastRun, MeasurementForecastRunRequest, MeasurementObservationBulk,
    MeasurementObservationCsv, MeasurementObservationImport, MeasurementProject,
    MeasurementSeriesCreate, MeasurementTargetCreate, ProjectComplete, ProjectEstimate,
    ProjectEstimateCreate, ProjectEstimateList, null_as_empty, validate_import,
};
use crate::transport::{Method, Transport, UreqTransport, percent_encode};

pub const APP_ITEM_KIND_MEASUREMENT_PROJECT: &str = "measurement_project";
pub const APP_ITEM_KIND_LINK_COLLECTION: &str = "link_collection";
pub const APP_ITEM_KIND_MEETING: &str = "meeting";

const ITEMS_PATH: &str = "/api/v1/app/items";
const ITEM_PATH: &str = "/api/v1/app/item";
const FORECAST_PATH: &str = "/api/v1/app/forecast";
const SITE_KEY_HEADER: &str = "X-Custd-Site-Key";
const USER_TOKEN_HEADER: &str = "X-Custd-User-Token";
pub(crate) const NO_BODY: Option<&()> = None;

/// A hosted app's view of Custd: its API origin, its Site key, and one of its allowed origins,
/// plus the signed-in user's access token when there is one.
#[derive(Clone)]
pub struct AppClient {
    base_url: String,
    site_key: String,
    origin: String,
    user_token: Option<String>,
    pub(crate) transport: Arc<dyn Transport>,
}

/// One item as the item routes reach it: through a link token, or as the signed-in owner.
#[derive(Clone)]
pub struct AppLink<'a> {
    app: &'a AppClient,
    access: Access,
}

#[derive(Clone)]
enum Access {
    Link(String),
    /// An item the signed-in user owns, named by `?item=` with no link.
    Owned(String),
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

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItemCreate {
    /// [`APP_ITEM_KIND_MEASUREMENT_PROJECT`], [`APP_ITEM_KIND_LINK_COLLECTION`] or
    /// [`APP_ITEM_KIND_MEETING`].
    pub kind: String,
    /// How long the item may go unchanged before it is deleted; default 7 days.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idle_expiry_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub measurement_project: Option<AppMeasurementProjectCreate>,
    /// The agenda of a meeting item.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meeting: Option<crate::app_meetings::AppMeetingCreate>,
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
    pub meeting: Option<AppMeeting>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppItem {
    pub item_uuid: String,
    pub kind: String,
    /// `owner` or `share`: what the presented link, or the signed-in owner, may do.
    pub role: String,
    /// `unowned`, `yours` or `other`: whether the signed-in caller owns it.
    pub ownership: String,
    pub version: i64,
    pub idle_expiry_seconds: i64,
    pub updated_at: String,
    pub expires_at: String,
}

/// One item of "my items", with its kind's name and short status.
#[derive(Debug, Clone, Deserialize)]
pub struct AppItemSummary {
    #[serde(flatten)]
    pub item: AppItem,
    /// The project's, meeting's or model's name; empty for a link collection.
    pub name: String,
    /// The project's or meeting's status; empty for a link collection or a model.
    pub status: String,
}

/// "My items": at most 200, most recently changed first.
#[derive(Debug, Clone, Deserialize)]
pub struct AppItemList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub items: Vec<AppItemSummary>,
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
            user_token: None,
            transport: Arc::new(UreqTransport::new()),
        }
    }

    /// The client a hosted app's discovery file describes; `origin` is one of its allowed origins.
    pub fn from_discovery(discovery: &HostedAppDiscovery, origin: impl Into<String>) -> Self {
        Self::new(&discovery.api_base_url, &discovery.browser_key, origin)
    }

    /// Sends the signed-in user's access token (`X-Custd-User-Token`) on every call, beside any
    /// link token. An item a signed-in creator makes is theirs at once.
    #[must_use]
    pub fn with_user_token(mut self, token: impl Into<String>) -> Self {
        self.user_token = Some(token.into());
        self
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

    /// "My items": the live items the signed-in user owns in this app. Needs
    /// [`AppClient::with_user_token`].
    pub fn list_my_items(&self) -> Result<AppItemList> {
        self.send(Method::Get, ITEMS_PATH.to_owned(), None, NO_BODY, None)
            .and_then(|response| decode(&response.body))
    }

    /// The item routes for one link token.
    pub fn link(&self, token: impl Into<String>) -> AppLink<'_> {
        AppLink {
            app: self,
            access: Access::Link(token.into()),
        }
    }

    /// The item routes for an item the signed-in user owns, reached with no link. Needs
    /// [`AppClient::with_user_token`].
    pub fn owned_item(&self, item_uuid: impl Into<String>) -> AppLink<'_> {
        AppLink {
            app: self,
            access: Access::Owned(item_uuid.into()),
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
        if let Some(user_token) = &self.user_token {
            headers.push((USER_TOKEN_HEADER, user_token.clone()));
        }
        if let Some(etag) = if_none_match {
            headers.push(("If-None-Match", etag.to_owned()));
        }
        let request = json_request(method, format!("{}{path}", self.base_url), headers, body)?;
        execute(self.transport.as_ref(), &request)
    }
}

impl AppLink<'_> {
    /// Makes the signed-in holder of this owner link the item's owner. A repeat by the same user
    /// succeeds; an item another user owns is refused with 409 `app_item_claimed`.
    pub fn claim(&self) -> Result<AppItemRead> {
        self.write(Method::Post, "/claim", NO_BODY)
    }

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
        let path = self.target(&format!("{FORECAST_PATH}/runs"), None);
        let response = self
            .app
            .send(Method::Post, path, self.token(), Some(request), None)?;
        decode(&response.body)
    }

    /// The project's measurements and forecast convergence.
    pub fn forecast_story(
        &self,
        options: &AppReadOptions,
    ) -> Result<Conditional<AppForecastStory>> {
        self.read_conditional(&format!("{FORECAST_PATH}/story"), options)
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

    /// A call to `/api/v1/app/item<suffix>`.
    pub(crate) fn write<T: DeserializeOwned>(
        &self,
        method: Method,
        suffix: &str,
        body: Option<&impl Serialize>,
    ) -> Result<T> {
        let path = self.target(&format!("{ITEM_PATH}{suffix}"), None);
        let response = self.app.send(method, path, self.token(), body, None)?;
        decode(&response.body)
    }

    fn token(&self) -> Option<&str> {
        match &self.access {
            Access::Link(token) => Some(token),
            Access::Owned(_) => None,
        }
    }

    /// The path with `?item=`: the collection entry a read names, else the owned item.
    fn target(&self, path: &str, item: Option<&str>) -> String {
        let owned = match &self.access {
            Access::Owned(item_uuid) => Some(item_uuid.as_str()),
            Access::Link(_) => None,
        };
        match item.or(owned) {
            Some(item) => format!("{path}?item={}", percent_encode(item)),
            None => path.to_owned(),
        }
    }

    fn read_conditional<T: DeserializeOwned>(
        &self,
        path: &str,
        options: &AppReadOptions,
    ) -> Result<Conditional<T>> {
        let path = self.target(path, options.item.as_deref());
        let if_none_match = options.if_none_match.as_deref();
        let response = self
            .app
            .send(Method::Get, path, self.token(), NO_BODY, if_none_match)?;
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
            .field(
                "user_token",
                &self.user_token.as_ref().map(|_| "<redacted>"),
            )
            .finish()
    }
}

impl fmt::Debug for AppLink<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut debug = f.debug_struct("AppLink");
        match &self.access {
            Access::Link(_) => debug.field("token", &"<redacted>"),
            Access::Owned(item_uuid) => debug.field("item", item_uuid),
        };
        debug.finish()
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
