import { type AppAlertDeliveryList, type AppAlertRule, type AppAlertRuleSpec, type AppAlertSettings, type AppAlertSlackCreateRequest, type AppAlertSubscription, type AppAlertWebhook, type AppAlertWebhookCreated, type AppAlertWebhookCreateRequest } from "./app-alerts.js";
import { type AppLiveWatch, type AppLiveWatchOptions } from "./app-live.js";
import { type AppMeeting, type AppMeetingAdvanceRequest, type AppMeetingCreate, type AppMeetingMinutes, type AppMeetingMinutesUpdate } from "./app-meetings.js";
import { type AppModelCalculateRequest, type AppModelCalculateResult, type AppModelCopyRequest, type AppModelCreate, type AppModelRun, type AppModelRunRequest, type AppModelVersionCreateRequest, type AppUncertaintyModel } from "./app-models.js";
import { type AppWebSocketFactory } from "./app-push.js";
export declare const APP_ITEM_SITE_KEY_HEADER = "X-Custd-Site-Key";
/** Carries the signed-in user's access token beside the link token. */
export declare const APP_ITEM_USER_TOKEN_HEADER = "X-Custd-User-Token";
export declare const APP_ITEM_OWNERSHIPS: {
    readonly unowned: "unowned";
    readonly yours: "yours";
    readonly other: "other";
};
/** How the item's owner relates to the signed-in caller. */
export type AppItemOwnership = (typeof APP_ITEM_OWNERSHIPS)[keyof typeof APP_ITEM_OWNERSHIPS];
export declare const APP_ITEM_KINDS: {
    readonly measurementProject: "measurement_project";
    readonly linkCollection: "link_collection";
    readonly uncertaintyModel: "uncertainty_model";
    readonly meeting: "meeting";
    readonly plan: "plan";
};
export type AppItemKind = (typeof APP_ITEM_KINDS)[keyof typeof APP_ITEM_KINDS];
export declare const APP_LINK_ROLES: {
    readonly owner: "owner";
    readonly share: "share";
};
export type AppLinkRole = (typeof APP_LINK_ROLES)[keyof typeof APP_LINK_ROLES];
export declare const APP_MEASUREMENT_PROJECT_KINDS: {
    readonly deadlineForecast: "deadline_forecast";
    readonly runwayForecast: "runway_forecast";
};
export type AppMeasurementProjectKind = (typeof APP_MEASUREMENT_PROJECT_KINDS)[keyof typeof APP_MEASUREMENT_PROJECT_KINDS];
export declare const APP_FORECAST_METHODS: {
    readonly bootstrapQuantile: "bootstrap_quantile";
    readonly bayesianLinearRegression: "bayesian_linear_regression";
    readonly seasonal7Day: "seasonal_7_day";
};
export type AppForecastMethod = (typeof APP_FORECAST_METHODS)[keyof typeof APP_FORECAST_METHODS];
/** Problem codes the app routes answer with. */
export declare const APP_ITEM_ERROR_CODES: {
    readonly keyRefused: "app_key_refused";
    readonly linkRefused: "app_link_refused";
    readonly readOnlyLink: "app_link_read_only";
    readonly notFound: "app_item_not_found";
    readonly wrongKind: "app_item_wrong_kind";
    readonly createLimited: "app_item_create_limited";
    readonly measurementLimit: "app_item_measurement_limit";
    readonly seriesRequired: "app_item_series_required";
    readonly collectionFull: "app_item_collection_full";
    readonly notCollectable: "app_item_not_collectable";
    readonly invalid: "app_item_invalid";
    readonly forecastMissing: "app_forecast_missing";
    /** Another user already owns the item. */
    readonly claimed: "app_item_claimed";
    /** The user access token does not sign anyone in to this app: sign in again. */
    readonly userRefused: "app_user_refused";
    /** The sign-in could not be checked right now; retry, and keep the user signed in. */
    readonly userCheckUnavailable: "app_user_check_unavailable";
    /** The route acts for a signed-in user and none was presented. */
    readonly signInRequired: "app_sign_in_required";
    /** The request never got an answer: offline, DNS, CORS refusal. */
    readonly network: "network";
    /** A success answer whose body was not JSON. */
    readonly invalidResponse: "invalid_response";
    /** The hosted app has no app data capability, or did not start. */
    readonly unavailable: "app_data_unavailable";
};
export type AppMeasurementSeriesCreate = {
    seriesCode: string;
    name: string;
    unitSlug: string;
    completionDirection: string;
    source: string;
};
export type AppMeasurementTargetCreate = {
    targetCode: string;
    name: string;
    targetValue: number;
    /** RFC 3339. */
    targetDate?: string;
    state: string;
};
/** The project a measurement_project item wraps. Custd chooses its project code. */
export type AppMeasurementProjectCreate = {
    kind: AppMeasurementProjectKind;
    name: string;
    description?: string;
    series: AppMeasurementSeriesCreate[];
    target: AppMeasurementTargetCreate;
};
export type AppItemCreateRequest = {
    kind: typeof APP_ITEM_KINDS.measurementProject;
    /** Seconds without a change before the item is deleted: 60 to 31536000, default 7 days. */
    idleExpirySeconds?: number;
    measurementProject: AppMeasurementProjectCreate;
} | {
    kind: typeof APP_ITEM_KINDS.linkCollection | typeof APP_ITEM_KINDS.plan;
    idleExpirySeconds?: number;
    name?: string;
} | {
    kind: typeof APP_ITEM_KINDS.meeting;
    idleExpirySeconds?: number;
    meeting: AppMeetingCreate;
} | {
    kind: typeof APP_ITEM_KINDS.uncertaintyModel;
    idleExpirySeconds?: number;
    uncertaintyModel: AppModelCreate;
};
/** Changes only the fields it names. */
export type AppProjectUpdateRequest = {
    name?: string;
    description?: string;
    status?: string;
    definitionOfDone?: string;
    deliveryTargetDate?: string;
    forecastMethod?: AppForecastMethod;
    runSimilar?: boolean;
};
export type AppItemSettingsRequest = {
    name?: string;
    idleExpirySeconds?: number;
    project?: AppProjectUpdateRequest;
};
export type AppPlanPart = {
    itemUuid: string;
    required: boolean;
    prerequisites: string[];
};
export type AppPlan = {
    name?: string;
    revision: number;
    deadline?: string;
    parts: AppPlanPart[];
};
export type AppPlanForecast = {
    revision: number;
    asOf: string;
    horizon: string;
    model: string;
    requiredParts: number;
    completedParts: number;
    missingParts: string[];
    deadlineProbability?: number;
    median?: string;
    lower?: string;
    upper?: string;
    horizonMissFraction?: number;
    observedProgress?: AppPlanProgressPoint[];
    projectedProgress?: AppPlanProgressBand[];
};
export type AppPlanProgressPoint = {
    at: string;
    completed: number;
};
export type AppPlanProgressBand = {
    at: string;
    lower: number;
    median: number;
    upper: number;
};
export type AppPlanUpdate = {
    expectedRevision: number;
    deadline?: string;
    parts: Array<AppPlanPart & {
        linkToken?: string;
    }>;
};
export type AppMeasurementRow = {
    /** Optional when the project has one series. */
    seriesUuid?: string;
    /** RFC 3339. */
    observedAt: string;
    value: number;
    idempotencyKey?: string;
    observationUuid?: string;
};
export type AppMeasurementBulkRequest = {
    rows: AppMeasurementRow[];
};
export type AppEstimateCreateRequest = {
    estimatedAt?: string;
    lowDate: string;
    highDate: string;
    note?: string;
};
export type AppProjectCompleteRequest = {
    completedAt: string;
};
export type AppLinkCollectionEntryAddRequest = {
    /** A share (or owner) link token of another item of this app. */
    token: string;
};
export type AppItem = {
    itemUuid: string;
    kind: AppItemKind;
    role: AppLinkRole;
    ownership: AppItemOwnership;
    version: number;
    idleExpirySeconds: number;
    updatedAt: string;
    expiresAt: string;
};
export type AppItemLink = {
    linkUuid: string;
    role: AppLinkRole;
    createdAt: string;
};
export type AppMeasurementSeries = {
    seriesUuid: string;
    seriesCode: string;
    name: string;
    unitSlug: string;
    completionDirection: string;
    source: string;
};
export type AppMeasurementTarget = {
    targetUuid: string;
    targetCode: string;
    name: string;
    targetValue: number;
    targetDate?: string;
    state: string;
    completedAt?: string;
};
export type AppMeasurementProject = {
    projectUuid: string;
    projectCode: string;
    kind: string;
    status: string;
    name: string;
    description: string;
    series?: AppMeasurementSeries[];
    target?: AppMeasurementTarget;
    delivery: {
        definitionOfDone: string;
        targetDate?: string;
        completedAt?: string;
    };
    run: {
        seriesRootUuid?: string;
        similar: boolean;
        forecastMethod?: string;
    };
    createdAt: string;
    updatedAt: string;
};
export type AppProjectEstimate = {
    estimateUuid: string;
    estimatedAt: string;
    lowDate: string;
    highDate: string;
    note: string;
};
export type AppProjectEstimateList = {
    deliveryTargetDate?: string;
    estimates: AppProjectEstimate[] | null;
    latest?: {
        estimate: AppProjectEstimate;
        chanceByDeliveryTarget?: number;
        ageDays: number;
        movementDays?: number;
    };
};
export type AppLinkCollectionEntry = {
    entryUuid: string;
    itemUuid: string;
    kind: AppItemKind;
    position: number;
    createdAt: string;
};
/** An item with its kind's content. `links` is listed for an owner link only. */
export type AppItemRead = {
    item: AppItem;
    links?: AppItemLink[];
    measurementProject?: AppMeasurementProject;
    estimates?: AppProjectEstimateList;
    linkCollection?: {
        entries: AppLinkCollectionEntry[] | null;
    };
    meeting?: AppMeeting;
    meetingMinutes?: AppMeetingMinutes;
    plan?: AppPlan;
    uncertaintyModel?: AppUncertaintyModel;
};
/** A new item and its two links. Each token is shown this once: keep it, Custd cannot. */
export type AppItemCreated = {
    item: AppItemRead;
    ownerToken: string;
    shareToken: string;
};
/** The replacement for a rotated link. The token is shown this once. */
export type AppItemLinkRotated = {
    link: AppItemLink;
    token: string;
};
export type AppMeasurementResult = {
    rowIndex: number;
    success: boolean;
    observationUuid?: string;
    status?: number;
    type?: string;
    title?: string;
    detail?: string;
};
/** Each row's outcome. `completedTargetUuid` names a target an accepted measurement reached. */
export type AppMeasurementBulkResponse = {
    importId: string;
    accepted: number;
    rejected: number;
    results: AppMeasurementResult[] | null;
    completedTargetUuid?: string;
};
/** One item of "my items", with its kind's name and short status so a list needs no reads. */
export type AppItemSummary = AppItem & {
    /** The project's, meeting's or model's name; empty for a link collection. */
    name: string;
    /** The project's or meeting run's status; empty for a link collection or a model. */
    status: string;
};
/** "My items": at most 200, most recently changed first. */
export type AppItemList = {
    items: AppItemSummary[] | null;
};
export type AppForecastRunRequest = {
    seed?: number;
    sampleCount?: number;
    method?: AppForecastMethod;
    forecastFrom?: string;
};
export type AppForecastPoint = {
    at: string;
    value: number;
};
export type AppForecastInterval = {
    confidence: number;
    lower: string;
    upper: string;
};
export type AppForecastWarning = {
    code: string;
    severity: string;
    message: string;
};
export type AppForecastCounterResult = {
    completionInterval?: AppForecastInterval;
    deadlineProbability?: number;
    rate?: {
        perDay: number;
        perHour: number;
        perMinute: number;
        perSecond: number;
    };
    pooledRunCount: number;
    detail: {
        arrivalHistogram: {
            bins: {
                start: string;
                end: string;
                count: number;
            }[] | null;
            neverCount: number;
        };
        posteriorLines: {
            points: AppForecastPoint[] | null;
        }[] | null;
    };
};
export type AppForecastRun = {
    forecastRunUuid: string;
    projectUuid: string;
    status: string;
    method: string;
    generatedAt: string;
    inputCount: number;
    sampleCount: number;
    seed: number;
    forecastFrom?: string;
    percentiles: Record<string, string>;
    warnings?: AppForecastWarning[] | null;
    provenance: Record<string, string>;
    counter?: AppForecastCounterResult;
};
export type AppForecastStorySnapshot = {
    runUuid: string;
    asOfAt: string;
    generatedAt: string;
    horizonEndAt?: string;
    inputCount: number;
    inputHash?: string;
    intervalState: string;
    method: string;
    movement: string;
    observedValue?: number;
    outputProbability?: number;
    percentiles: {
        p10?: string;
        p25?: string;
        p50?: string;
        p75?: string;
        p90?: string;
    };
    sampleCount: number;
    status: string;
    warnings?: AppForecastWarning[] | null;
};
export type AppForecastStoryEstimate = {
    estimatedAt: string;
    low: string;
    high: string;
    note?: string;
    widthDays: number;
    movementDays?: number;
};
/** The story's compiled chart presentation. Its nested layers and tables are server-rendered. */
export type AppForecastStoryPresentation = {
    version: number;
    presetId: string;
    renderer: string;
    caption: string;
    summary: string;
    nonColorEncoding: string;
    width: number;
    height: number;
    layers: unknown[] | null;
    references: unknown[] | null;
    tableColumns: unknown[] | null;
    tableRows: unknown[] | null;
    supportingTables?: unknown[] | null;
};
/** A linked prediction's story. Its history, outcomes and sources are passed through as served. */
export type AppForecastStoryPrediction = {
    definitionUuid: string;
    definitionKey: string;
    displayName: string;
    state: string;
    qualityState: string;
    current?: unknown;
    evaluation?: unknown;
    history: unknown[] | null;
    outcomes: unknown[] | null;
    contributions: unknown[] | null;
    sources: unknown[] | null;
};
/** The project's measurements and forecast convergence. */
export type AppForecastStory = {
    projectUuid: string;
    projectName: string;
    projectKind: string;
    state: string;
    currentSnapshotUuid?: string;
    truncated: boolean;
    target: {
        available: boolean;
        label: string;
        value: number;
        deadline?: string;
    };
    observations: {
        observedAt: string;
        value: number;
    }[] | null;
    snapshots: AppForecastStorySnapshot[] | null;
    prediction?: AppForecastStoryPrediction;
    delivery: {
        targetDate?: string;
        estimates: AppForecastStoryEstimate[] | null;
    };
    presentation: AppForecastStoryPresentation;
    trust: {
        state: string;
        evidence: string;
        observationCount: number;
        snapshotCount: number;
    };
    provenance: {
        owner: string;
        generatedAt: string;
        latestEngine?: string;
        latestInputHash?: string;
    };
};
/** A read with `If-None-Match`: new content and its ETag, or confirmation the last one holds. */
export type AppConditionalRead<T> = {
    status: "modified";
    data: T;
    etag: string | null;
} | {
    status: "not_modified";
    etag: string;
};
export type AppReadOptions = {
    /** Read an item of the presented link collection by its UUID. */
    item?: string;
    /** The ETag of the last read; the answer is `not_modified` while it holds. */
    etag?: string;
};
export type AppProblem = {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    code?: string;
    traceId?: string;
    fields?: Record<string, string>;
    retryability?: "none" | "bounded";
    /** Per-element refusals; `subject` names the element, such as a model quantity. */
    fieldErrors?: AppFieldError[];
};
export type AppFieldError = {
    subject?: string;
    field: string;
    code: string;
    message: string;
};
export declare class AppItemError extends Error {
    /** HTTP status; null when no answer arrived. */
    readonly status: number | null;
    readonly code: string;
    readonly problem?: AppProblem | undefined;
    readonly name = "AppItemError";
    constructor(
    /** HTTP status; null when no answer arrived. */
    status: number | null, code: string, problem?: AppProblem | undefined);
    /** The user must sign in (again): their access token was refused, or none was sent. */
    get signInNeeded(): boolean;
    /** Alert email needs a verified address: the signed-in user must verify one first. */
    get verifiedEmailNeeded(): boolean;
    /** Retrying cannot help: the link, key or request itself was refused. */
    get terminal(): boolean;
}
/**
 * Who calls an item route: a link token (`Authorization: Bearer`), the signed-in user's access
 * token (`X-Custd-User-Token`), or both. `send` is the one place that turns it into headers.
 */
export type AppItemCredential = {
    linkToken?: string;
    userToken?: string;
};
/**
 * How a call reaches its item: a link token, or `{ item }` for an item the signed-in user owns,
 * reached with their access token and no link.
 */
export type AppItemAccess = string | {
    item: string;
};
export type AppItemsClientConfig = {
    /** The API origin, as the hosted app's discovery file names it. */
    apiBaseUrl: string;
    /** The app's public Site key (`site_pk_...`). */
    siteKey: string;
    fetch?: typeof fetch;
    /**
     * The signed-in user's current access token, or nothing when signed out. Sent beside the link
     * on every call; the hosted app reads it from its `BrowserSignIn`.
     */
    userToken?: () => string | null | undefined;
    /**
     * Opens the realtime socket that pushes changes to watched reads. Defaults to the global
     * WebSocket, unless you supplied your own `fetch`; then pass one here too. `null` keeps watched
     * reads on polling only. Without push, or while it is down, watched reads poll as before.
     */
    webSocket?: AppWebSocketFactory | null;
};
export declare class AppItemsClient {
    private readonly baseUrl;
    private readonly siteKey;
    private readonly fetchImpl;
    private readonly userToken;
    private readonly live;
    constructor(config: AppItemsClientConfig);
    /** Builds the client from a hosted app's discovery file. */
    static fromDiscovery(discovery: {
        apiBaseUrl: string;
        browserKey: string;
    }, options?: Pick<AppItemsClientConfig, "fetch" | "userToken" | "webSocket">): AppItemsClient;
    /**
     * Creates an item with the Site key; a signed-in creator owns it at once. Keep both tokens:
     * they are shown this once.
     */
    createItem(request: AppItemCreateRequest): Promise<AppItemCreated>;
    /** "My items": the live items the signed-in user owns in this app, most recently changed first. */
    listMyItems(): Promise<AppItemList>;
    /**
     * Makes the signed-in holder of an owner link the item's owner. A repeat by the same user
     * succeeds; an item another user owns is refused with `claimed`.
     */
    claim(ownerToken: string): Promise<AppItemRead>;
    readItem(access: AppItemAccess, options?: AppReadOptions): Promise<AppConditionalRead<AppItemRead>>;
    planForecast(access: AppItemAccess): Promise<AppPlanForecast>;
    updatePlan(access: AppItemAccess, request: AppPlanUpdate): Promise<AppItemRead>;
    updateSettings(access: AppItemAccess, request: AppItemSettingsRequest): Promise<AppItemRead>;
    /** Records up to 1000 measurements; check each row's `success`. */
    addMeasurements(access: AppItemAccess, request: AppMeasurementBulkRequest): Promise<AppMeasurementBulkResponse>;
    /** Records measurements from a pasted CSV document. */
    importMeasurementsCsv(access: AppItemAccess, csv: string): Promise<AppMeasurementBulkResponse>;
    createEstimate(access: AppItemAccess, request: AppEstimateCreateRequest): Promise<AppProjectEstimate>;
    complete(access: AppItemAccess, request: AppProjectCompleteRequest): Promise<AppItemRead>;
    cancel(access: AppItemAccess): Promise<AppItemRead>;
    reopen(access: AppItemAccess): Promise<AppItemRead>;
    /** Adds the item a pasted link opens to a link collection. */
    addEntry(access: AppItemAccess, request: AppLinkCollectionEntryAddRequest): Promise<AppLinkCollectionEntry>;
    removeEntry(access: AppItemAccess, entryUuid: string): Promise<void>;
    revokeLink(access: AppItemAccess, linkUuid: string): Promise<void>;
    /** Replaces a link; the old token stops working. The new token is shown this once. */
    rotateLink(access: AppItemAccess, linkUuid: string): Promise<AppItemLinkRotated>;
    /** Runs the item's forecast. Owner link only. */
    runForecast(access: AppItemAccess, request?: AppForecastRunRequest): Promise<AppForecastRun>;
    /** The newest forecast run; a `forecastMissing` AppItemError until one exists. */
    latestForecast(access: AppItemAccess, options?: AppReadOptions): Promise<AppConditionalRead<AppForecastRun>>;
    forecastRun(access: AppItemAccess, runUuid: string, options?: AppReadOptions): Promise<AppConditionalRead<AppForecastRun>>;
    forecastStory(access: AppItemAccess, options?: AppReadOptions): Promise<AppConditionalRead<AppForecastStory>>;
    /** Saves a new immutable version of the item's model: the whole quantity list. Owner link only. */
    addModelVersion(access: AppItemAccess, request: AppModelVersionCreateRequest): Promise<AppItemRead>;
    /** Copies a version into a new model item with its own two links, each token shown this once. */
    copyModel(access: AppItemAccess, request?: AppModelCopyRequest): Promise<AppItemCreated>;
    /** Runs the item's model and stores the run, which becomes every viewer's latest. Owner link only. */
    runModel(access: AppItemAccess, request: AppModelRunRequest): Promise<AppModelRun>;
    /** Runs a version with some inputs set to other values and returns only `outputs`. Any link; never stored. */
    calculateModel(access: AppItemAccess, request: AppModelCalculateRequest): Promise<AppModelCalculateResult>;
    /** The newest model run; a `runMissing` AppItemError until one exists. */
    latestModelRun(access: AppItemAccess, options?: AppReadOptions): Promise<AppConditionalRead<AppModelRun>>;
    /** The item's alert rules, webhooks and the signed-in caller's email subscription. Owner only. */
    alertSettings(access: AppItemAccess): Promise<AppAlertSettings>;
    /** The item's newest alert deliveries, at most 100. Owner only. */
    alertDeliveries(access: AppItemAccess): Promise<AppAlertDeliveryList>;
    /** Adds a rule that fires once each time its condition becomes true. At most 10 per item. */
    addAlertRule(access: AppItemAccess, rule: AppAlertRuleSpec): Promise<AppAlertRule>;
    /** Removes a rule and its delivery history. */
    removeAlertRule(access: AppItemAccess, ruleUuid: string): Promise<void>;
    /** Registers a signed webhook. Its `signingSecret` is shown this once. At most 5 per item. */
    addAlertWebhook(access: AppItemAccess, request: AppAlertWebhookCreateRequest): Promise<AppAlertWebhookCreated>;
    /**
     * Posts the item's alerts to a Slack incoming webhook as Slack messages. The URL is checked,
     * stored sealed and never returned; it counts against the 5 webhooks per item.
     */
    addAlertSlack(access: AppItemAccess, request: AppAlertSlackCreateRequest): Promise<AppAlertWebhook>;
    /** Removes a webhook or Slack destination; its undelivered alerts go with it. */
    removeAlertWebhook(access: AppItemAccess, webhookUuid: string): Promise<void>;
    /**
     * Emails the signed-in user's verified address when a rule fires; repeating it keeps one
     * subscription. Refused with `app_sign_in_required` when signed out, `verifiedEmailNeeded` when
     * the user has no verified address, and a retryable `emailCheckUnavailable`.
     */
    subscribeAlertEmail(access: AppItemAccess): Promise<AppAlertSubscription>;
    /** Stops the signed-in user's alert email. Repeating it succeeds. */
    unsubscribeAlertEmail(access: AppItemAccess): Promise<void>;
    /** Starts the meeting item's first block. Owner only. */
    updateMeetingMinutes(access: AppItemAccess, request: AppMeetingMinutesUpdate): Promise<AppItemRead>;
    startMeeting(access: AppItemAccess): Promise<AppItemRead>;
    /**
     * Finishes the block `blockUuid` names (the meeting's `currentBlockUuid`) and puts the next one
     * on. Repeating the advance of the block that just finished returns the meeting unchanged; any
     * other block is refused with a 409 `stepRefused`, after which watched reads poll at once.
     */
    advanceMeeting(access: AppItemAccess, request: AppMeetingAdvanceRequest): Promise<AppItemRead>;
    /** Ends the meeting now; blocks not reached are recorded as `not_run`. */
    endMeeting(access: AppItemAccess): Promise<AppItemRead>;
    /** A self-refreshing latest model run; `empty` until the first run exists. */
    watchLatestModelRun(access: AppItemAccess, options?: AppLiveWatchOptions): AppLiveWatch<AppModelRun>;
    /** A self-refreshing item read, shared by every caller watching the same item and link. */
    watchItem(access: AppItemAccess, options?: AppLiveWatchOptions): AppLiveWatch<AppItemRead>;
    /** A self-refreshing latest forecast; `empty` until the first run exists. */
    watchLatestForecast(access: AppItemAccess, options?: AppLiveWatchOptions): AppLiveWatch<AppForecastRun>;
    /** A self-refreshing forecast story. */
    watchForecastStory(access: AppItemAccess, options?: AppLiveWatchOptions): AppLiveWatch<AppForecastStory>;
    /** Polls every watched read now, for example after the signed-in user changed. */
    refreshAll(): void;
    private liveKey;
    /** What a watched read subscribes with: its link, or the signed-in user's own item. */
    private pushTarget;
    /** The link or user-owned item a call reaches, with the signed-in user when there is one. */
    private reach;
    private signedIn;
    private write;
    private meetingStep;
    private conditional;
    private json;
    private send;
}
export type AppItemLinkParts = {
    /** The app's host, such as `counter.apps.custd.com`. */
    host: string;
    /** The page path of the item's kind, such as `c` for a counter. */
    kindPath: string;
    token: string;
};
/**
 * The owner page: the token sits in the fragment, which browsers never send to a server, so no
 * request log or page view records it.
 */
export declare function appItemOwnerUrl(parts: AppItemLinkParts): string;
/** The read-only share page. A share token may sit in the path because it only reads. */
export declare function appItemShareUrl(parts: AppItemLinkParts): string;
export type ParsedAppItemLink = {
    token: string;
    /** Known from the URL shape; absent for a bare token. */
    role?: AppLinkRole;
    kindPath?: string;
};
/** Reads a pasted owner URL, share URL or bare token. Returns null when it holds no link token. */
export declare function parseAppItemLink(input: string): ParsedAppItemLink | null;
