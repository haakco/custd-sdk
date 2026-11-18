//! Typed client for the Custd API.
//!
//! - [`CustdClient`] calls the signed-in measurement routes with a bearer access token.
//! - [`AppClient`] calls the hosted-app item routes (`/api/v1/app/`) with an app's Site key and a
//!   link token, the signed-in user's token, or both: items, meetings, alerts and forecasts.
//! - [`read_hosted_app_discovery`] reads a hosted app's `/.well-known/custd.json`.
//! - [`DeviceLogin`] signs a person in with the RFC 8628 device flow, the same way `custdctl` does.
//!
//! Every call is blocking. Every request reports this release in `X-Custd-Sdk`.

mod app;
mod app_alerts;
mod app_meetings;
mod app_story;
mod client;
mod device;
mod discovery;
mod error;
mod measurement;
mod transport;

pub use app::{
    APP_ITEM_KIND_LINK_COLLECTION, APP_ITEM_KIND_MEASUREMENT_PROJECT, APP_ITEM_KIND_MEETING,
    AppClient, AppItem, AppItemCreate, AppItemCreated, AppItemLink, AppItemLinkRotated,
    AppItemList, AppItemRead, AppItemSummary, AppLink, AppLinkCollection, AppLinkCollectionEntry,
    AppMeasurementProjectCreate, AppReadOptions, Conditional,
};
pub use app_alerts::{
    APP_ALERT_EMAIL_CHECK_UNAVAILABLE, APP_ALERT_LIMIT, APP_ALERT_NO_VERIFIED_EMAIL,
    APP_ALERT_RULE_DEADLINE_PROBABILITY_BELOW, APP_ALERT_RULE_ESTIMATE_STALE,
    APP_ALERT_RULE_FORECAST_MOVED_INSIDE_TARGET, APP_ALERT_RULE_TARGET_REACHED, AppAlertDelivery,
    AppAlertDeliveryList, AppAlertRule, AppAlertRuleSpec, AppAlertSettings, AppAlertSubscription,
    AppAlertWebhook, AppAlertWebhookCreated,
};
pub use app_meetings::{
    APP_ITEM_MEETING_STEP_REFUSED, AppMeeting, AppMeetingBlock, AppMeetingBlockCreate,
    AppMeetingCreate, AppMeetingSummary,
};
pub use app_story::{
    AppForecastStory, AppForecastStoryDelivery, AppForecastStoryEstimate,
    AppForecastStoryObservation, AppForecastStoryPercentiles, AppForecastStoryPresentation,
    AppForecastStoryProvenance, AppForecastStorySnapshot, AppForecastStoryTarget,
    AppForecastStoryTrust,
};
pub use client::CustdClient;
pub use device::{
    DeviceInstructions, DeviceLogin, DeviceLoginError, DeviceToken, device_user_code_groups,
};
pub use discovery::{
    HOSTED_APP_DISCOVERY_PATH, HostedAppDiscovery, HostedAppSignIn, read_hosted_app_discovery,
};
pub use error::{ApiError, Error, Problem};
pub use measurement::{
    MeasurementForecastCounter, MeasurementForecastDetail, MeasurementForecastHistogram,
    MeasurementForecastHistogramBin, MeasurementForecastInterval, MeasurementForecastLine,
    MeasurementForecastPoint, MeasurementForecastRate, MeasurementForecastRun,
    MeasurementForecastRunRequest, MeasurementForecastWarning, MeasurementObservation,
    MeasurementObservationBulk, MeasurementObservationImport, MeasurementObservationResult,
    MeasurementProject, MeasurementProjectCreate, MeasurementProjectDelivery,
    MeasurementProjectList, MeasurementProjectRun, MeasurementSeries, MeasurementSeriesCreate,
    MeasurementTarget, MeasurementTargetCreate, ProjectComplete, ProjectEstimate,
    ProjectEstimateCreate, ProjectEstimateList, ProjectEstimateStatus,
};

/// This SDK's released version, taken from `Cargo.toml` (which `scripts/bump-version.sh` moves).
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// The `X-Custd-Sdk` value every request carries.
pub const SDK_IDENTITY: &str = concat!("rust/", env!("CARGO_PKG_VERSION"));

/// The result of a request, or the error that stopped it.
pub type Result<T> = std::result::Result<T, Error>;
