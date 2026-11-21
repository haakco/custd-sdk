// Meeting items (Admin API /api/v1/app/item/meeting): an agenda of blocks, each with a predicted
// time. The owner starts it, advances block by block and ends it; an overrun block takes its extra
// time from the blocks after it. Every step returns the item read with the meeting as it runs.
export const APP_MEETING_STATUSES = {
    /** Created, not started. */
    ready: "ready",
    running: "running",
    completed: "completed",
    cancelled: "cancelled",
};
export const APP_MEETING_BLOCK_STATUSES = {
    pending: "pending",
    active: "active",
    completed: "completed",
    skipped: "skipped",
    /** The meeting ended before the block was reached. */
    notRun: "not_run",
};
/** Problem codes the meeting routes answer with. */
export const APP_MEETING_ERROR_CODES = {
    /**
     * 409: the meeting cannot take this step now, such as advancing a block that is neither on nor
     * the one that last finished. Read the meeting again and act on its `currentBlockUuid`.
     */
    stepRefused: "app_item_meeting_step_refused",
};
