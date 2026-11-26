use custd_sdk::{
    ErrorIssue, ErrorIssueDetail, ErrorIssueListResponse, ErrorIssueStateRequest, ErrorIssuesSort,
    ErrorIssuesState,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/error-issues",
            "/api/v1/error-issues?siteUuid=s-1&state=open&sort=recent&limit=7&cursor=c-1&companySlug=acme",
            |c| {
                drop(c.custd.list_error_issues(
                    Some("s-1"),
                    Some(ErrorIssuesState::Open),
                    Some(ErrorIssuesSort::Recent),
                    Some(7),
                    Some("c-1"),
                    Some("acme"),
                ))
            },
            round_trip::<ErrorIssueListResponse>,
        ),
        row(
            "admin-api GET /api/v1/error-issues/{issueUuid}",
            "/api/v1/error-issues/i-1?companySlug=acme",
            |c| drop(c.custd.get_error_issue("i-1", Some("acme"))),
            round_trip::<ErrorIssueDetail>,
        ),
        row(
            "admin-api POST /api/v1/error-issues/{issueUuid}/state",
            "/api/v1/error-issues/i-1/state?companySlug=acme",
            |c| {
                drop(c.custd.update_error_issue_state(
                    "i-1",
                    &body::<ErrorIssueStateRequest>(r#"{"state":"open"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<ErrorIssue>,
        ),
    ]
}
