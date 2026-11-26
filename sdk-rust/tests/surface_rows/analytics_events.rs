use custd_sdk::{
    AnalyticsEventsQueryRequest, AnalyticsEventsQueryResponse, AnalyticsRangeQueryRequest,
    AnalyticsRangeQueryResponse,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "analytics-api POST /api/v1/analytics/query",
            "/api/v1/analytics/query",
            |c| {
                drop(
                    c.custd
                        .query_analytics_events(&body::<AnalyticsEventsQueryRequest>(
                            r#"{"date":"x","eventType":"x","limit":1,"source":"x"}"#,
                        )),
                )
            },
            round_trip::<AnalyticsEventsQueryResponse>,
        ),
        row(
            "analytics-api POST /api/v1/analytics/query-range",
            "/api/v1/analytics/query-range",
            |c| {
                drop(c.custd.query_analytics_event_range(&body::<AnalyticsRangeQueryRequest>(r#"{"eventType":"x","from":"x","groupBy":"x","limit":1,"source":"x","to":"x"}"#)))
            },
            round_trip::<AnalyticsRangeQueryResponse>,
        ),
    ]
}
