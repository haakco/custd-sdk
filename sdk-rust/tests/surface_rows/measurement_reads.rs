use custd_sdk::{MeasurementForecastStoryResponse, MeasurementOverviewResponse};

use super::round_trip;
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "analytics-api GET /api/v1/measurement/overview",
            "/api/v1/measurement/overview",
            |c| drop(c.custd.get_measurement_overview()),
            round_trip::<MeasurementOverviewResponse>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-story",
            "/api/v1/measurement/projects/p-1/forecast-story",
            |c| drop(c.custd.get_measurement_forecast_story("p-1")),
            round_trip::<MeasurementForecastStoryResponse>,
        ),
    ]
}
