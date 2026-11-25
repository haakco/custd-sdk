//! Typed client for the Custd API.
//!
//! - [`CustdClient`] calls the signed-in measurement routes with a bearer access token.
//! - [`CustdClient`] also manages a Site's public status page by domain UUID.
//! - [`AppClient`] calls the hosted-app item routes (`/api/v1/app/`) with an app's Site key and a
//!   link token, the signed-in user's token, or both: items, meetings, alerts and forecasts.
//! - [`read_hosted_app_discovery`] reads a hosted app's `/.well-known/custd.json`.
//! - [`BrowserLogin`] signs in to a hosted application with a configured loopback callback.
//! - [`DeviceLogin`] signs a person in with the RFC 8628 device flow, the same way `custdctl` does.
//!
//! Every call is blocking. Every request reports this release in `X-Custd-Sdk`.

mod app;
mod app_alerts;
mod app_meetings;
mod app_models;
mod app_story;
mod browser_login;
mod client;
mod device;
mod discovery;
mod error;
mod measurement;
mod site_status_page;
mod transport;

pub use app::{
    APP_ITEM_KIND_LINK_COLLECTION, APP_ITEM_KIND_MEASUREMENT_PROJECT, APP_ITEM_KIND_MEETING,
    APP_ITEM_KIND_PLAN, APP_ITEM_KIND_UNCERTAINTY_MODEL, AppClient, AppItem, AppItemCreate,
    AppItemCreated, AppItemLink, AppItemLinkRotated, AppItemList, AppItemRead, AppItemSummary,
    AppLink, AppLinkCollection, AppLinkCollectionEntry, AppMeasurementProjectCreate, AppPlan,
    AppPlanForecast, AppPlanPart, AppPlanPartUpdate, AppPlanProgressBand, AppPlanProgressPoint,
    AppPlanUpdate, AppReadOptions, Conditional,
};
pub use app_alerts::{
    APP_ALERT_DESTINATION_SLACK, APP_ALERT_DESTINATION_WEBHOOK, APP_ALERT_EMAIL_CHECK_UNAVAILABLE,
    APP_ALERT_LIMIT, APP_ALERT_NO_VERIFIED_EMAIL, APP_ALERT_RULE_DEADLINE_PROBABILITY_BELOW,
    APP_ALERT_RULE_ESTIMATE_STALE, APP_ALERT_RULE_FORECAST_MOVED_INSIDE_TARGET,
    APP_ALERT_RULE_TARGET_REACHED, AppAlertDelivery, AppAlertDeliveryList, AppAlertRule,
    AppAlertRuleSpec, AppAlertSettings, AppAlertSubscription, AppAlertWebhook,
    AppAlertWebhookCreated,
};
pub use app_meetings::{
    APP_ITEM_MEETING_STEP_REFUSED, AppMeeting, AppMeetingAction, AppMeetingBlock,
    AppMeetingBlockCreate, AppMeetingCreate, AppMeetingMinutes, AppMeetingMinutesUpdate,
    AppMeetingSummary, AppPlanMeetingSummary,
};
pub use app_models::{
    AppModelHistogram, AppModelPercentiles, AppModelQuantityError, AppModelQuantityResult,
    AppModelQuantitySummary, AppModelRun, AppModelRunRequest, AppUncertaintyModel,
};
pub use app_story::{
    AppForecastStory, AppForecastStoryDelivery, AppForecastStoryEstimate,
    AppForecastStoryObservation, AppForecastStoryPercentiles, AppForecastStoryPresentation,
    AppForecastStoryProvenance, AppForecastStorySnapshot, AppForecastStoryTarget,
    AppForecastStoryTrust,
};
pub use browser_login::BrowserLogin;
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
pub use site_status_page::{
    SiteStatusComponent, SiteStatusComponentStatus, SiteStatusDraft, SiteStatusPage,
    SiteStatusPublication, SiteStatusSelection, SiteStatusSettings, SiteStatusUpdate,
    SiteStatusUpdateHistory, SiteStatusUpdateRequest,
};

/// This SDK's released version, taken from `Cargo.toml` (which `scripts/bump-version.sh` moves).
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// The `X-Custd-Sdk` value every request carries.
pub const SDK_IDENTITY: &str = concat!("rust/", env!("CARGO_PKG_VERSION"));

/// The result of a request, or the error that stopped it.
pub type Result<T> = std::result::Result<T, Error>;
