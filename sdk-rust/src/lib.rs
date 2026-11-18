//! Typed client for the Custd API.
//!
//! - [`CustdClient`] calls the signed-in measurement routes with a bearer access token.
//! - [`AppClient`] calls the hosted-app item routes (`/api/v1/app/`) with an app's Site key and a
//!   link token, with no login.
//! - [`DeviceLogin`] signs a person in with the RFC 8628 device flow, the same way `custdctl` does.
//!
//! Every call is blocking. Every request reports this release in `X-Custd-Sdk`.

mod app;
mod client;
mod device;
mod error;
mod measurement;
mod transport;

pub use app::{
    APP_ITEM_KIND_LINK_COLLECTION, APP_ITEM_KIND_MEASUREMENT_PROJECT, AppClient, AppItem,
    AppItemCreate, AppItemCreated, AppItemLink, AppItemLinkRotated, AppItemRead, AppLink,
    AppLinkCollection, AppLinkCollectionEntry, AppMeasurementProjectCreate, AppReadOptions,
    Conditional,
};
pub use client::CustdClient;
pub use device::{
    DeviceInstructions, DeviceLogin, DeviceLoginError, DeviceToken, device_user_code_groups,
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
