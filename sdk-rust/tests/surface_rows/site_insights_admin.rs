use custd_sdk::{
    AccessLogHourReplay, AccessLogHourReplayRequest, SiteAIPlatformUsage,
    SiteAIPlatformUsagePeriod, SiteInsightsTaskList,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/site-insights/ai-usage",
            "/api/v1/admin/site-insights/ai-usage?period=day",
            |c| {
                drop(
                    c.custd
                        .get_site_ai_platform_usage(Some(SiteAIPlatformUsagePeriod::Day)),
                )
            },
            round_trip::<SiteAIPlatformUsage>,
        ),
        row(
            "admin-api GET /api/v1/admin/site-insights/tasks",
            "/api/v1/admin/site-insights/tasks",
            |c| drop(c.custd.list_site_insights_tasks()),
            round_trip::<SiteInsightsTaskList>,
        ),
        row(
            "admin-api POST /api/v1/admin/access-log-hours/replay",
            "/api/v1/admin/access-log-hours/replay",
            |c| {
                drop(
                    c.custd
                        .replay_access_log_hour(&body::<AccessLogHourReplayRequest>(
                            r#"{"hourStart":"x"}"#,
                        )),
                )
            },
            round_trip::<AccessLogHourReplay>,
        ),
    ]
}
