//! Meeting items: an agenda of blocks, each with a predicted time, that the owner starts,
//! advances block by block and ends. An overrun block takes its extra time from the blocks after
//! it. Every step answers the item read with the meeting as it runs.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::app::{AppItemRead, AppLink, NO_BODY};
use crate::measurement::null_as_empty;
use crate::transport::Method;

/// 409: the meeting cannot take this step now, such as advancing a block that is neither on nor
/// the one that last finished. Read the meeting again and act on its `current_block_uuid`.
pub const APP_ITEM_MEETING_STEP_REFUSED: &str = "app_item_meeting_step_refused";

/// A meeting item's agenda: 1 to 128 blocks lasting at most 28 days in all.
#[derive(Debug, Clone, Serialize)]
pub struct AppMeetingCreate {
    pub name: String,
    pub blocks: Vec<AppMeetingBlockCreate>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeetingBlockCreate {
    /// At most 200 bytes.
    pub title: String,
    /// Milliseconds, at least 1000.
    pub predicted_ms: i64,
}

/// A meeting as it runs. `status` is `ready`, `running`, `completed` or `cancelled`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeeting {
    pub name: String,
    pub status: String,
    pub started_at: Option<String>,
    /// When the agenda is planned to finish.
    pub ends_at: Option<String>,
    /// The block that is on now, if any.
    pub current_block_uuid: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub blocks: Vec<AppMeetingBlock>,
    pub summary: AppMeetingSummary,
}

/// One block as it runs. `status` is `pending`, `active`, `completed`, `skipped` or `not_run`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeetingBlock {
    pub block_uuid: String,
    pub position: i64,
    pub title: String,
    pub status: String,
    /// The time the agenda predicted.
    pub predicted_ms: i64,
    /// The time it has now: an overrun earlier block shrinks the blocks after it.
    pub allocated_ms: i64,
    /// The time it took, once it is done.
    pub actual_ms: i64,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
}

/// The agenda's predicted time against the time its finished blocks took.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeetingSummary {
    pub predicted_ms: i64,
    pub finished_predicted_ms: i64,
    pub finished_actual_ms: i64,
    pub finished_blocks: i64,
    /// How far the meeting ran past its planned end.
    pub overrun_ms: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppMeetingAdvance<'a> {
    block_uuid: &'a str,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeetingAction {
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub part_uuid: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeetingMinutes {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plan_uuid: Option<String>,
    pub minutes: String,
    pub decisions: String,
    pub actions: Vec<AppMeetingAction>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeetingMinutesUpdate {
    #[serde(flatten)]
    pub minutes: AppMeetingMinutes,
    pub expected_revision: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plan_link_token: Option<String>,
}

impl AppLink<'_> {
    /// Saves the owner's private notes and actions at an expected item revision.
    pub fn update_meeting_minutes(&self, update: &AppMeetingMinutesUpdate) -> Result<AppItemRead> {
        self.write(Method::Patch, "/meeting/minutes", Some(update))
    }

    /// Starts the meeting's first block. Owner only.
    pub fn start_meeting(&self) -> Result<AppItemRead> {
        self.write(Method::Post, "/meeting/start", NO_BODY)
    }

    /// Finishes the block `block_uuid` names (the meeting's `current_block_uuid`) and puts the
    /// next one on. Repeating the advance of the block that just finished returns the meeting
    /// unchanged; any other block is refused with [`APP_ITEM_MEETING_STEP_REFUSED`].
    pub fn advance_meeting(&self, block_uuid: &str) -> Result<AppItemRead> {
        let body = AppMeetingAdvance { block_uuid };
        self.write(Method::Post, "/meeting/advance", Some(&body))
    }

    /// Ends the meeting now; blocks not reached are recorded as `not_run`.
    pub fn end_meeting(&self) -> Result<AppItemRead> {
        self.write(Method::Post, "/meeting/end", NO_BODY)
    }
}
