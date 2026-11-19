export declare const APP_MEETING_STATUSES: {
    /** Created, not started. */
    readonly ready: "ready";
    readonly running: "running";
    readonly completed: "completed";
    readonly cancelled: "cancelled";
};
export type AppMeetingStatus = (typeof APP_MEETING_STATUSES)[keyof typeof APP_MEETING_STATUSES];
export declare const APP_MEETING_BLOCK_STATUSES: {
    readonly pending: "pending";
    readonly active: "active";
    readonly completed: "completed";
    readonly skipped: "skipped";
    /** The meeting ended before the block was reached. */
    readonly notRun: "not_run";
};
export type AppMeetingBlockStatus = (typeof APP_MEETING_BLOCK_STATUSES)[keyof typeof APP_MEETING_BLOCK_STATUSES];
/** Problem codes the meeting routes answer with. */
export declare const APP_MEETING_ERROR_CODES: {
    /**
     * 409: the meeting cannot take this step now, such as advancing a block that is neither on nor
     * the one that last finished. Read the meeting again and act on its `currentBlockUuid`.
     */
    readonly stepRefused: "app_item_meeting_step_refused";
};
export type AppMeetingBlockCreate = {
    /** At most 200 bytes. */
    title: string;
    /** Milliseconds, at least 1000. */
    predictedMs: number;
};
/** A meeting item's agenda: 1 to 128 blocks lasting at most 28 days in all. */
export type AppMeetingCreate = {
    name: string;
    blocks: AppMeetingBlockCreate[];
};
/** Names the block an advance finishes: a repeat is a no-op, any other block a stale 409. */
export type AppMeetingAdvanceRequest = {
    blockUuid: string;
};
export type AppMeetingBlock = {
    blockUuid: string;
    position: number;
    title: string;
    status: AppMeetingBlockStatus;
    /** The time the agenda predicted. */
    predictedMs: number;
    /** The time it has now: an overrun earlier block shrinks the blocks after it. */
    allocatedMs: number;
    /** The time it took, once it is done. */
    actualMs: number;
    startedAt?: string;
    endedAt?: string;
};
/** The agenda's predicted time against the time its finished blocks took. */
export type AppMeetingSummary = {
    predictedMs: number;
    finishedPredictedMs: number;
    finishedActualMs: number;
    finishedBlocks: number;
    /** How far the meeting ran past its planned end. */
    overrunMs: number;
};
/** A meeting as it runs. `startedAt` and `endsAt` are set once it starts. */
export type AppMeeting = {
    name: string;
    status: AppMeetingStatus;
    startedAt?: string;
    /** When the agenda is planned to finish. */
    endsAt?: string;
    /** The block that is on now, if any. */
    currentBlockUuid?: string;
    blocks: AppMeetingBlock[] | null;
    summary: AppMeetingSummary;
};
export type AppMeetingAction = {
    description: string;
    partUuid?: string;
};
export type AppMeetingMinutes = {
    planUuid?: string;
    minutes: string;
    decisions: string;
    actions: AppMeetingAction[];
};
export type AppMeetingMinutesUpdate = AppMeetingMinutes & {
    expectedRevision: number;
    planLinkToken?: string;
};
