// Browser data access for hosted apps: create an item with the app's Site key, then read and
// change it with its owner link, or only read it with its share link. A link token travels only
// in the Authorization header: never in a URL, a log line or an error message.

import {
  APP_ALERT_ERROR_CODES,
  type AppAlertDeliveryList,
  type AppAlertRule,
  type AppAlertRuleSpec,
  type AppAlertSettings,
  type AppAlertSlackCreateRequest,
  type AppAlertSubscription,
  type AppAlertWebhook,
  type AppAlertWebhookCreated,
  type AppAlertWebhookCreateRequest,
} from "./app-alerts.js";
import {
  APP_LIVE_STATUSES,
  type AppLiveRead,
  AppLiveRegistry,
  type AppLiveWatch,
  type AppLiveWatchOptions,
} from "./app-live.js";
import {
  APP_MEETING_ERROR_CODES,
  type AppMeeting,
  type AppMeetingAdvanceRequest,
  type AppMeetingCreate,
  type AppMeetingMinutes,
  type AppMeetingMinutesUpdate,
} from "./app-meetings.js";
import {
  APP_MODEL_ERROR_CODES,
  type AppModelCalculateRequest,
  type AppModelCalculateResult,
  type AppModelCopyRequest,
  type AppModelCreate,
  type AppModelRun,
  type AppModelRunRequest,
  type AppModelVersionCreateRequest,
  type AppUncertaintyModel,
} from "./app-models.js";
import {
  AppPushChannel,
  type AppPushTarget,
  type AppWebSocketFactory,
  appRealtimeUrl,
  globalWebSocketFactory,
} from "./app-push.js";

export const APP_ITEM_SITE_KEY_HEADER = "X-Custd-Site-Key";
/** Carries the signed-in user's access token beside the link token. */
export const APP_ITEM_USER_TOKEN_HEADER = "X-Custd-User-Token";

export const APP_ITEM_OWNERSHIPS = {
  unowned: "unowned",
  yours: "yours",
  other: "other",
} as const;

/** How the item's owner relates to the signed-in caller. */
export type AppItemOwnership = (typeof APP_ITEM_OWNERSHIPS)[keyof typeof APP_ITEM_OWNERSHIPS];

export const APP_ITEM_KINDS = {
  measurementProject: "measurement_project",
  linkCollection: "link_collection",
  uncertaintyModel: "uncertainty_model",
  meeting: "meeting",
  plan: "plan",
} as const;

export type AppItemKind = (typeof APP_ITEM_KINDS)[keyof typeof APP_ITEM_KINDS];

export const APP_LINK_ROLES = {
  owner: "owner",
  share: "share",
} as const;

export type AppLinkRole = (typeof APP_LINK_ROLES)[keyof typeof APP_LINK_ROLES];

export const APP_MEASUREMENT_PROJECT_KINDS = {
  deadlineForecast: "deadline_forecast",
  runwayForecast: "runway_forecast",
} as const;

export type AppMeasurementProjectKind =
  (typeof APP_MEASUREMENT_PROJECT_KINDS)[keyof typeof APP_MEASUREMENT_PROJECT_KINDS];

export const APP_FORECAST_METHODS = {
  bootstrapQuantile: "bootstrap_quantile",
  bayesianLinearRegression: "bayesian_linear_regression",
  seasonal7Day: "seasonal_7_day",
} as const;

export type AppForecastMethod = (typeof APP_FORECAST_METHODS)[keyof typeof APP_FORECAST_METHODS];

/** Problem codes the app routes answer with. */
export const APP_ITEM_ERROR_CODES = {
  keyRefused: "app_key_refused",
  linkRefused: "app_link_refused",
  readOnlyLink: "app_link_read_only",
  notFound: "app_item_not_found",
  wrongKind: "app_item_wrong_kind",
  createLimited: "app_item_create_limited",
  measurementLimit: "app_item_measurement_limit",
  seriesRequired: "app_item_series_required",
  collectionFull: "app_item_collection_full",
  notCollectable: "app_item_not_collectable",
  invalid: "app_item_invalid",
  forecastMissing: "app_forecast_missing",
  /** Another user already owns the item. */
  claimed: "app_item_claimed",
  /** The user access token does not sign anyone in to this app: sign in again. */
  userRefused: "app_user_refused",
  /** The sign-in could not be checked right now; retry, and keep the user signed in. */
  userCheckUnavailable: "app_user_check_unavailable",
  /** The route acts for a signed-in user and none was presented. */
  signInRequired: "app_sign_in_required",
  /** The request never got an answer: offline, DNS, CORS refusal. */
  network: "network",
  /** A success answer whose body was not JSON. */
  invalidResponse: "invalid_response",
  /** The hosted app has no app data capability, or did not start. */
  unavailable: "app_data_unavailable",
} as const;

// ---- Requests (Admin API /api/v1/app/items, /api/v1/app/item) ----

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

export type AppItemCreateRequest =
  | {
      kind: typeof APP_ITEM_KINDS.measurementProject;
      /** Seconds without a change before the item is deleted: 60 to 31536000, default 7 days. */
      idleExpirySeconds?: number;
      measurementProject: AppMeasurementProjectCreate;
    }
  | {
      kind: typeof APP_ITEM_KINDS.linkCollection | typeof APP_ITEM_KINDS.plan;
      idleExpirySeconds?: number;
      name?: string;
    }
  | { kind: typeof APP_ITEM_KINDS.meeting; idleExpirySeconds?: number; meeting: AppMeetingCreate }
  | { kind: typeof APP_ITEM_KINDS.uncertaintyModel; idleExpirySeconds?: number; uncertaintyModel: AppModelCreate };

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
};

export type AppPlanUpdate = {
  expectedRevision: number;
  deadline?: string;
  parts: Array<AppPlanPart & { linkToken?: string }>;
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

export type AppMeasurementBulkRequest = { rows: AppMeasurementRow[] };

export type AppEstimateCreateRequest = {
  estimatedAt?: string;
  lowDate: string;
  highDate: string;
  note?: string;
};

export type AppProjectCompleteRequest = { completedAt: string };

export type AppLinkCollectionEntryAddRequest = {
  /** A share (or owner) link token of another item of this app. */
  token: string;
};

// ---- Responses ----

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
  delivery: { definitionOfDone: string; targetDate?: string; completedAt?: string };
  run: { seriesRootUuid?: string; similar: boolean; forecastMethod?: string };
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
  linkCollection?: { entries: AppLinkCollectionEntry[] | null };
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
export type AppItemLinkRotated = { link: AppItemLink; token: string };

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
export type AppItemList = { items: AppItemSummary[] | null };

// ---- Forecast (Analytics API /api/v1/app/forecast) ----

export type AppForecastRunRequest = {
  seed?: number;
  sampleCount?: number;
  method?: AppForecastMethod;
  forecastFrom?: string;
};

export type AppForecastPoint = { at: string; value: number };
export type AppForecastInterval = { confidence: number; lower: string; upper: string };
export type AppForecastWarning = { code: string; severity: string; message: string };

export type AppForecastCounterResult = {
  completionInterval?: AppForecastInterval;
  deadlineProbability?: number;
  rate?: { perDay: number; perHour: number; perMinute: number; perSecond: number };
  pooledRunCount: number;
  detail: {
    arrivalHistogram: {
      bins: { start: string; end: string; count: number }[] | null;
      neverCount: number;
    };
    posteriorLines: { points: AppForecastPoint[] | null }[] | null;
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
  percentiles: { p10?: string; p25?: string; p50?: string; p75?: string; p90?: string };
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
  target: { available: boolean; label: string; value: number; deadline?: string };
  observations: { observedAt: string; value: number }[] | null;
  snapshots: AppForecastStorySnapshot[] | null;
  prediction?: AppForecastStoryPrediction;
  delivery: { targetDate?: string; estimates: AppForecastStoryEstimate[] | null };
  presentation: AppForecastStoryPresentation;
  trust: { state: string; evidence: string; observationCount: number; snapshotCount: number };
  provenance: { owner: string; generatedAt: string; latestEngine?: string; latestInputHash?: string };
};

// ---- Conditional reads and errors ----

/** A read with `If-None-Match`: new content and its ETag, or confirmation the last one holds. */
export type AppConditionalRead<T> =
  | { status: "modified"; data: T; etag: string | null }
  | { status: "not_modified"; etag: string };

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

export type AppFieldError = { subject?: string; field: string; code: string; message: string };

export class AppItemError extends Error {
  readonly name = "AppItemError";

  constructor(
    /** HTTP status; null when no answer arrived. */
    readonly status: number | null,
    readonly code: string,
    readonly problem?: AppProblem,
  ) {
    super(`custd: app item request failed [status=${status ?? "none"} code=${code}]`);
  }

  /** The user must sign in (again): their access token was refused, or none was sent. */
  get signInNeeded(): boolean {
    return this.code === APP_ITEM_ERROR_CODES.userRefused || this.code === APP_ITEM_ERROR_CODES.signInRequired;
  }

  /** Alert email needs a verified address: the signed-in user must verify one first. */
  get verifiedEmailNeeded(): boolean {
    return this.code === APP_ALERT_ERROR_CODES.noVerifiedEmail;
  }

  /** Retrying cannot help: the link, key or request itself was refused. */
  get terminal(): boolean {
    return (
      this.status !== null && this.status >= 400 && this.status < 500 && this.status !== 408 && this.status !== 429
    );
  }
}

// ---- Client ----

/**
 * Who calls an item route: a link token (`Authorization: Bearer`), the signed-in user's access
 * token (`X-Custd-User-Token`), or both. `send` is the one place that turns it into headers.
 */
export type AppItemCredential = { linkToken?: string; userToken?: string };

/**
 * How a call reaches its item: a link token, or `{ item }` for an item the signed-in user owns,
 * reached with their access token and no link.
 */
export type AppItemAccess = string | { item: string };

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

type AppRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  credential?: AppItemCredential;
  item?: string;
  etag?: string;
  body?: unknown;
};

const ITEMS_PATH = "/api/v1/app/items";
const ITEM_PATH = "/api/v1/app/item";
const FORECAST_PATH = "/api/v1/app/forecast";
const MODELS_PATH = "/api/v1/app/models";
const ALERTS_PATH = `${ITEM_PATH}/alerts`;
const MEETING_PATH = `${ITEM_PATH}/meeting`;

export class AppItemsClient {
  private readonly baseUrl: string;
  private readonly siteKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly userToken: AppItemsClientConfig["userToken"];
  private readonly live: AppLiveRegistry;

  constructor(config: AppItemsClientConfig) {
    this.baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
    this.siteKey = config.siteKey;
    this.fetchImpl = config.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.userToken = config.userToken;
    const createSocket =
      config.webSocket === undefined ? (config.fetch ? undefined : globalWebSocketFactory()) : config.webSocket;
    this.live = new AppLiveRegistry(
      createSocket ? new AppPushChannel(appRealtimeUrl(this.baseUrl), this.siteKey, createSocket) : undefined,
    );
  }

  /** Builds the client from a hosted app's discovery file. */
  static fromDiscovery(
    discovery: { apiBaseUrl: string; browserKey: string },
    options: Pick<AppItemsClientConfig, "fetch" | "userToken" | "webSocket"> = {},
  ): AppItemsClient {
    return new AppItemsClient({
      apiBaseUrl: discovery.apiBaseUrl,
      siteKey: discovery.browserKey,
      fetch: options.fetch,
      userToken: options.userToken,
      webSocket: options.webSocket,
    });
  }

  /**
   * Creates an item with the Site key; a signed-in creator owns it at once. Keep both tokens:
   * they are shown this once.
   */
  async createItem(request: AppItemCreateRequest): Promise<AppItemCreated> {
    return this.json<AppItemCreated>({ method: "POST", path: ITEMS_PATH, body: request, ...this.signedIn() });
  }

  /** "My items": the live items the signed-in user owns in this app, most recently changed first. */
  async listMyItems(): Promise<AppItemList> {
    return this.json<AppItemList>({ method: "GET", path: ITEMS_PATH, ...this.signedIn() });
  }

  /**
   * Makes the signed-in holder of an owner link the item's owner. A repeat by the same user
   * succeeds; an item another user owns is refused with `claimed`.
   */
  claim(ownerToken: string): Promise<AppItemRead> {
    return this.write<AppItemRead>(ownerToken, "POST", `${ITEM_PATH}/claim`);
  }

  readItem(access: AppItemAccess, options: AppReadOptions = {}): Promise<AppConditionalRead<AppItemRead>> {
    return this.conditional<AppItemRead>(ITEM_PATH, access, options);
  }

  planForecast(access: AppItemAccess): Promise<AppPlanForecast> {
    return this.json<AppPlanForecast>({ method: "GET", path: `${ITEM_PATH}/plan/forecast`, ...this.reach(access) });
  }

  updatePlan(access: AppItemAccess, request: AppPlanUpdate): Promise<AppItemRead> {
    return this.write<AppItemRead>(access, "PATCH", `${ITEM_PATH}/plan`, request);
  }

  updateSettings(access: AppItemAccess, request: AppItemSettingsRequest): Promise<AppItemRead> {
    return this.write<AppItemRead>(access, "PATCH", ITEM_PATH, request);
  }

  /** Records up to 1000 measurements; check each row's `success`. */
  addMeasurements(access: AppItemAccess, request: AppMeasurementBulkRequest): Promise<AppMeasurementBulkResponse> {
    return this.write<AppMeasurementBulkResponse>(access, "POST", `${ITEM_PATH}/measurements`, request);
  }

  /** Records measurements from a pasted CSV document. */
  importMeasurementsCsv(access: AppItemAccess, csv: string): Promise<AppMeasurementBulkResponse> {
    return this.write<AppMeasurementBulkResponse>(access, "POST", `${ITEM_PATH}/measurements/csv`, { csv });
  }

  createEstimate(access: AppItemAccess, request: AppEstimateCreateRequest): Promise<AppProjectEstimate> {
    return this.write<AppProjectEstimate>(access, "POST", `${ITEM_PATH}/estimates`, request);
  }

  complete(access: AppItemAccess, request: AppProjectCompleteRequest): Promise<AppItemRead> {
    return this.write<AppItemRead>(access, "POST", `${ITEM_PATH}/complete`, request);
  }

  cancel(access: AppItemAccess): Promise<AppItemRead> {
    return this.write<AppItemRead>(access, "POST", `${ITEM_PATH}/cancel`);
  }

  reopen(access: AppItemAccess): Promise<AppItemRead> {
    return this.write<AppItemRead>(access, "POST", `${ITEM_PATH}/reopen`);
  }

  /** Adds the item a pasted link opens to a link collection. */
  addEntry(access: AppItemAccess, request: AppLinkCollectionEntryAddRequest): Promise<AppLinkCollectionEntry> {
    return this.write<AppLinkCollectionEntry>(access, "POST", `${ITEM_PATH}/entries`, request);
  }

  async removeEntry(access: AppItemAccess, entryUuid: string): Promise<void> {
    await this.write<null>(access, "DELETE", `${ITEM_PATH}/entries/${encodeURIComponent(entryUuid)}`);
  }

  async revokeLink(access: AppItemAccess, linkUuid: string): Promise<void> {
    await this.write<null>(access, "DELETE", `${ITEM_PATH}/links/${encodeURIComponent(linkUuid)}`);
  }

  /** Replaces a link; the old token stops working. The new token is shown this once. */
  rotateLink(access: AppItemAccess, linkUuid: string): Promise<AppItemLinkRotated> {
    return this.write<AppItemLinkRotated>(access, "POST", `${ITEM_PATH}/links/${encodeURIComponent(linkUuid)}/rotate`);
  }

  /** Runs the item's forecast. Owner link only. */
  runForecast(access: AppItemAccess, request: AppForecastRunRequest = {}): Promise<AppForecastRun> {
    return this.write<AppForecastRun>(access, "POST", `${FORECAST_PATH}/runs`, request);
  }

  /** The newest forecast run; a `forecastMissing` AppItemError until one exists. */
  latestForecast(access: AppItemAccess, options: AppReadOptions = {}): Promise<AppConditionalRead<AppForecastRun>> {
    return this.conditional<AppForecastRun>(`${FORECAST_PATH}/latest`, access, options);
  }

  forecastRun(
    access: AppItemAccess,
    runUuid: string,
    options: AppReadOptions = {},
  ): Promise<AppConditionalRead<AppForecastRun>> {
    return this.conditional<AppForecastRun>(`${FORECAST_PATH}/runs/${encodeURIComponent(runUuid)}`, access, options);
  }

  forecastStory(access: AppItemAccess, options: AppReadOptions = {}): Promise<AppConditionalRead<AppForecastStory>> {
    return this.conditional<AppForecastStory>(`${FORECAST_PATH}/story`, access, options);
  }

  /** Saves a new immutable version of the item's model: the whole quantity list. Owner link only. */
  addModelVersion(access: AppItemAccess, request: AppModelVersionCreateRequest): Promise<AppItemRead> {
    return this.write<AppItemRead>(access, "POST", `${ITEM_PATH}/model/versions`, request);
  }

  /** Copies a version into a new model item with its own two links, each token shown this once. */
  copyModel(access: AppItemAccess, request: AppModelCopyRequest = {}): Promise<AppItemCreated> {
    return this.write<AppItemCreated>(access, "POST", `${ITEM_PATH}/model/copy`, request);
  }

  /** Runs the item's model and stores the run, which becomes every viewer's latest. Owner link only. */
  runModel(access: AppItemAccess, request: AppModelRunRequest): Promise<AppModelRun> {
    return this.write<AppModelRun>(access, "POST", `${MODELS_PATH}/runs`, request);
  }

  /** Runs a version with some inputs set to other values and returns only `outputs`. Any link; never stored. */
  calculateModel(access: AppItemAccess, request: AppModelCalculateRequest): Promise<AppModelCalculateResult> {
    return this.json<AppModelCalculateResult>({
      method: "POST",
      path: `${MODELS_PATH}/calculate`,
      body: request,
      ...this.reach(access),
    });
  }

  /** The newest model run; a `runMissing` AppItemError until one exists. */
  latestModelRun(access: AppItemAccess, options: AppReadOptions = {}): Promise<AppConditionalRead<AppModelRun>> {
    return this.conditional<AppModelRun>(`${MODELS_PATH}/latest`, access, options);
  }

  /** The item's alert rules, webhooks and the signed-in caller's email subscription. Owner only. */
  alertSettings(access: AppItemAccess): Promise<AppAlertSettings> {
    return this.json<AppAlertSettings>({ method: "GET", path: ALERTS_PATH, ...this.reach(access) });
  }

  /** The item's newest alert deliveries, at most 100. Owner only. */
  alertDeliveries(access: AppItemAccess): Promise<AppAlertDeliveryList> {
    return this.json<AppAlertDeliveryList>({ method: "GET", path: `${ALERTS_PATH}/deliveries`, ...this.reach(access) });
  }

  /** Adds a rule that fires once each time its condition becomes true. At most 10 per item. */
  addAlertRule(access: AppItemAccess, rule: AppAlertRuleSpec): Promise<AppAlertRule> {
    return this.json<AppAlertRule>({ method: "POST", path: `${ALERTS_PATH}/rules`, body: rule, ...this.reach(access) });
  }

  /** Removes a rule and its delivery history. */
  async removeAlertRule(access: AppItemAccess, ruleUuid: string): Promise<void> {
    await this.json<null>({
      method: "DELETE",
      path: `${ALERTS_PATH}/rules/${encodeURIComponent(ruleUuid)}`,
      ...this.reach(access),
    });
  }

  /** Registers a signed webhook. Its `signingSecret` is shown this once. At most 5 per item. */
  addAlertWebhook(access: AppItemAccess, request: AppAlertWebhookCreateRequest): Promise<AppAlertWebhookCreated> {
    return this.json<AppAlertWebhookCreated>({
      method: "POST",
      path: `${ALERTS_PATH}/webhooks`,
      body: request,
      ...this.reach(access),
    });
  }

  /**
   * Posts the item's alerts to a Slack incoming webhook as Slack messages. The URL is checked,
   * stored sealed and never returned; it counts against the 5 webhooks per item.
   */
  addAlertSlack(access: AppItemAccess, request: AppAlertSlackCreateRequest): Promise<AppAlertWebhook> {
    return this.json<AppAlertWebhook>({
      method: "POST",
      path: `${ALERTS_PATH}/slack`,
      body: request,
      ...this.reach(access),
    });
  }

  /** Removes a webhook or Slack destination; its undelivered alerts go with it. */
  async removeAlertWebhook(access: AppItemAccess, webhookUuid: string): Promise<void> {
    await this.json<null>({
      method: "DELETE",
      path: `${ALERTS_PATH}/webhooks/${encodeURIComponent(webhookUuid)}`,
      ...this.reach(access),
    });
  }

  /**
   * Emails the signed-in user's verified address when a rule fires; repeating it keeps one
   * subscription. Refused with `app_sign_in_required` when signed out, `verifiedEmailNeeded` when
   * the user has no verified address, and a retryable `emailCheckUnavailable`.
   */
  subscribeAlertEmail(access: AppItemAccess): Promise<AppAlertSubscription> {
    return this.json<AppAlertSubscription>({
      method: "PUT",
      path: `${ALERTS_PATH}/subscription`,
      ...this.reach(access),
    });
  }

  /** Stops the signed-in user's alert email. Repeating it succeeds. */
  async unsubscribeAlertEmail(access: AppItemAccess): Promise<void> {
    await this.json<null>({ method: "DELETE", path: `${ALERTS_PATH}/subscription`, ...this.reach(access) });
  }

  /** Starts the meeting item's first block. Owner only. */
  updateMeetingMinutes(access: AppItemAccess, request: AppMeetingMinutesUpdate): Promise<AppItemRead> {
    return this.write<AppItemRead>(access, "PATCH", `${ITEM_PATH}/meeting/minutes`, request);
  }

  startMeeting(access: AppItemAccess): Promise<AppItemRead> {
    return this.meetingStep(access, "start");
  }

  /**
   * Finishes the block `blockUuid` names (the meeting's `currentBlockUuid`) and puts the next one
   * on. Repeating the advance of the block that just finished returns the meeting unchanged; any
   * other block is refused with a 409 `stepRefused`, after which watched reads poll at once.
   */
  advanceMeeting(access: AppItemAccess, request: AppMeetingAdvanceRequest): Promise<AppItemRead> {
    return this.meetingStep(access, "advance", request);
  }

  /** Ends the meeting now; blocks not reached are recorded as `not_run`. */
  endMeeting(access: AppItemAccess): Promise<AppItemRead> {
    return this.meetingStep(access, "end");
  }

  /** A self-refreshing latest model run; `empty` until the first run exists. */
  watchLatestModelRun(access: AppItemAccess, options: AppLiveWatchOptions = {}): AppLiveWatch<AppModelRun> {
    return this.live.watch(
      this.liveKey(access, "model_latest", options.item),
      accessKey(access),
      options,
      (etag) => this.latestModelRun(access, { item: options.item, etag }).catch(noModelRunYet),
      this.pushTarget(access, options.item),
    );
  }

  /** A self-refreshing item read, shared by every caller watching the same item and link. */
  watchItem(access: AppItemAccess, options: AppLiveWatchOptions = {}): AppLiveWatch<AppItemRead> {
    return this.live.watch(
      this.liveKey(access, "item", options.item),
      accessKey(access),
      options,
      (etag) => this.readItem(access, { item: options.item, etag }),
      this.pushTarget(access, options.item),
    );
  }

  /** A self-refreshing latest forecast; `empty` until the first run exists. */
  watchLatestForecast(access: AppItemAccess, options: AppLiveWatchOptions = {}): AppLiveWatch<AppForecastRun> {
    return this.live.watch(
      this.liveKey(access, "forecast_latest", options.item),
      accessKey(access),
      options,
      (etag) => this.latestForecast(access, { item: options.item, etag }).catch(noForecastYet),
      this.pushTarget(access, options.item),
    );
  }

  /** A self-refreshing forecast story. */
  watchForecastStory(access: AppItemAccess, options: AppLiveWatchOptions = {}): AppLiveWatch<AppForecastStory> {
    return this.live.watch(
      this.liveKey(access, "forecast_story", options.item),
      accessKey(access),
      options,
      (etag) => this.forecastStory(access, { item: options.item, etag }),
      this.pushTarget(access, options.item),
    );
  }

  /** Polls every watched read now, for example after the signed-in user changed. */
  refreshAll(): void {
    this.live.refreshAll();
  }

  private liveKey(access: AppItemAccess, resource: string, item: string | undefined): string {
    return `${resource}\u0000${item ?? ""}\u0000${accessKey(access)}`;
  }

  /** What a watched read subscribes with: its link, or the signed-in user's own item. */
  private pushTarget(access: AppItemAccess, item: string | undefined): AppPushTarget {
    const userToken = () => this.userToken?.()?.trim() || undefined;
    if (typeof access === "string") return { linkToken: access, item, userToken };
    return { item: item ?? access.item, userToken };
  }

  /** The link or user-owned item a call reaches, with the signed-in user when there is one. */
  private reach(access: AppItemAccess): { credential: AppItemCredential; item?: string } {
    const userToken = this.userToken?.()?.trim() || undefined;
    if (typeof access === "string") return { credential: { linkToken: access, userToken } };
    return { credential: { userToken }, item: access.item };
  }

  private signedIn(): { credential: AppItemCredential } {
    return { credential: { userToken: this.userToken?.()?.trim() || undefined } };
  }

  private async write<T>(
    access: AppItemAccess,
    method: AppRequest["method"],
    path: string,
    body?: unknown,
  ): Promise<T> {
    const result = await this.json<T>({ method, path, body, ...this.reach(access) });
    this.live.refreshToken(accessKey(access));
    return result;
  }

  private async meetingStep(
    access: AppItemAccess,
    step: string,
    body?: AppMeetingAdvanceRequest,
  ): Promise<AppItemRead> {
    try {
      return await this.write<AppItemRead>(access, "POST", `${MEETING_PATH}/${step}`, body);
    } catch (error) {
      // A refused step means this page's view is behind: show watchers the meeting as it is.
      if (error instanceof AppItemError && error.code === APP_MEETING_ERROR_CODES.stepRefused) {
        this.live.refreshToken(accessKey(access));
      }
      throw error;
    }
  }

  private async conditional<T>(
    path: string,
    access: AppItemAccess,
    options: AppReadOptions,
  ): Promise<AppConditionalRead<T>> {
    const reached = this.reach(access);
    const response = await this.send({
      method: "GET",
      path,
      credential: reached.credential,
      item: options.item ?? reached.item,
      etag: options.etag,
    });
    if (response.status === 304)
      return { status: "not_modified", etag: response.headers.get("etag") ?? options.etag ?? "" };
    const data = (await response.json().catch(() => {
      throw new AppItemError(response.status, APP_ITEM_ERROR_CODES.invalidResponse);
    })) as T;
    return { status: "modified", data, etag: response.headers.get("etag") };
  }

  private async json<T>(request: AppRequest): Promise<T> {
    const response = await this.send(request);
    if (response.status === 204) return null as T;
    return (await response.json()) as T;
  }

  private async send(request: AppRequest): Promise<Response> {
    const url = new URL(`${this.baseUrl}${request.path}`);
    if (request.item) url.searchParams.set("item", request.item);
    // Only the headers the app routes' preflight allows.
    const headers: Record<string, string> = { [APP_ITEM_SITE_KEY_HEADER]: this.siteKey };
    if (request.credential?.linkToken) headers.Authorization = `Bearer ${request.credential.linkToken}`;
    if (request.credential?.userToken) headers[APP_ITEM_USER_TOKEN_HEADER] = request.credential.userToken;
    if (request.etag) headers["If-None-Match"] = request.etag;
    if (request.body !== undefined) headers["Content-Type"] = "application/json";
    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method: request.method,
        headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        credentials: "omit",
        cache: "no-store",
      });
    } catch {
      throw new AppItemError(null, APP_ITEM_ERROR_CODES.network);
    }
    if (response.ok || response.status === 304) return response;
    throw await problemError(response);
  }
}

function accessKey(access: AppItemAccess): string {
  return typeof access === "string" ? access : `item:${access.item}`;
}

async function problemError(response: Response): Promise<AppItemError> {
  const body: unknown = await response.json().catch(() => null);
  const problem = isRecord(body) ? (body as AppProblem) : undefined;
  const code = typeof problem?.code === "string" && problem.code !== "" ? problem.code : `http_${response.status}`;
  return new AppItemError(response.status, code, problem);
}

/** A missing forecast is an empty answer, not a failure: polling carries on until a run lands. */
function noForecastYet(error: unknown): AppLiveRead<AppForecastRun> {
  if (error instanceof AppItemError && error.code === APP_ITEM_ERROR_CODES.forecastMissing) {
    return { status: APP_LIVE_STATUSES.empty };
  }
  throw error;
}

function noModelRunYet(error: unknown): AppLiveRead<AppModelRun> {
  if (error instanceof AppItemError && error.code === APP_MODEL_ERROR_CODES.runMissing) {
    return { status: APP_LIVE_STATUSES.empty };
  }
  throw error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---- Links ----

/** A link token is 32 random bytes as unpadded base64url. */
const LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

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
export function appItemOwnerUrl(parts: AppItemLinkParts): string {
  return `https://${parts.host}/edit/${encodeURIComponent(parts.kindPath)}#${parts.token}`;
}

/** The read-only share page. A share token may sit in the path because it only reads. */
export function appItemShareUrl(parts: AppItemLinkParts): string {
  return `https://${parts.host}/${encodeURIComponent(parts.kindPath)}/${parts.token}`;
}

export type ParsedAppItemLink = {
  token: string;
  /** Known from the URL shape; absent for a bare token. */
  role?: AppLinkRole;
  kindPath?: string;
};

/** Reads a pasted owner URL, share URL or bare token. Returns null when it holds no link token. */
export function parseAppItemLink(input: string): ParsedAppItemLink | null {
  const value = input.trim();
  if (LINK_TOKEN_PATTERN.test(value)) return { token: value };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  const fragment = url.hash.replace(/^#/, "");
  if (segments[0] === "edit" && segments.length === 2 && LINK_TOKEN_PATTERN.test(fragment)) {
    return { token: fragment, role: APP_LINK_ROLES.owner, kindPath: segments[1] };
  }
  const last = segments[segments.length - 1];
  if (segments.length === 2 && last !== undefined && LINK_TOKEN_PATTERN.test(last)) {
    return { token: last, role: APP_LINK_ROLES.share, kindPath: segments[0] };
  }
  return null;
}
