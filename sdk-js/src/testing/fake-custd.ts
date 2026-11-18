// An in-memory Custd for app tests: the hosted app discovery file, the /api/v1/app/ item, link,
// measurement, estimate, forecast, model, alert and meeting routes, and a PKCE sign-in. It answers
// at the wire level (`handle`, for a browser route interceptor) and as a `fetch` (for the SDK's own
// clients), records every request, and builds every answer from the SDK's DTOs, so a contract
// change fails the typecheck here first. Results are deterministic and deliberately simple.

import {
  APP_ALERT_CHANNELS,
  APP_ALERT_DELIVERY_OUTCOMES,
  APP_ALERT_DESTINATION_KINDS,
  APP_ALERT_ERROR_CODES,
  APP_ALERT_RULE_TYPES,
  type AppAlertDelivery,
  type AppAlertRule,
  type AppAlertRuleSpec,
  type AppAlertSettings,
  type AppAlertSlackCreateRequest,
  type AppAlertSubscription,
  type AppAlertWebhook,
  type AppAlertWebhookCreated,
  type AppAlertWebhookCreateRequest,
} from "../app-alerts.js";
import {
  APP_ITEM_ERROR_CODES,
  APP_ITEM_KINDS,
  APP_ITEM_OWNERSHIPS,
  APP_ITEM_SITE_KEY_HEADER,
  APP_ITEM_USER_TOKEN_HEADER,
  APP_LINK_ROLES,
  type AppEstimateCreateRequest,
  type AppForecastRun,
  type AppForecastRunRequest,
  type AppItemCreated,
  type AppItemCreateRequest,
  type AppItemKind,
  type AppItemLink,
  type AppItemLinkRotated,
  type AppItemRead,
  type AppItemSettingsRequest,
  type AppItemSummary,
  AppItemsClient,
  type AppLinkCollectionEntry,
  type AppLinkCollectionEntryAddRequest,
  type AppLinkRole,
  type AppMeasurementBulkRequest,
  type AppMeasurementBulkResponse,
  type AppMeasurementProject,
  type AppProjectCompleteRequest,
  type AppProjectEstimate,
} from "../app-items.js";
import type { AppMeeting, AppMeetingAdvanceRequest } from "../app-meetings.js";
import {
  APP_MODEL_ERROR_CODES,
  type AppModelCalculateRequest,
  type AppModelCalculateResult,
  type AppModelCopyRequest,
  type AppModelQuantity,
  type AppModelRun,
  type AppModelRunRequest,
  type AppModelVersionCreateRequest,
  type AppUncertaintyModel,
} from "../app-models.js";
import type { BrowserSignIn, SignInSession, SignInStorage } from "../browser-sign-in.js";
import type { BrowserTracker } from "../browser-tracker.js";
import type { CaptureExceptionRequest } from "../error-capture.js";
import {
  HOSTED_APP_CAPABILITIES,
  HOSTED_APP_DISCOVERY_PATH,
  type HostedAppCapability,
  type HostedAppDiscovery,
  type HostedAppErrorCapture,
  type HostedAppOptions,
} from "../hosted-app.js";
import {
  advanceFakeMeeting,
  endFakeMeeting,
  FakeCustdProblem,
  type FakeObservation,
  fakeEstimateList,
  fakeForecastRun,
  fakeForecastStory,
  fakeMeeting,
  fakeModelResults,
  fakeSensitivity,
  fromEnd,
  startFakeMeeting,
} from "./fake-results.js";

export const FAKE_CUSTD_ORIGIN = "https://app.custd.test";
export const FAKE_CUSTD_SITE_KEY = "site_pk_fake";
export const FAKE_CUSTD_API_PATH = "/__custd";
export const FAKE_CUSTD_AUTH_PATH = "/__auth";
const DEFAULT_IDLE_SECONDS = 7 * 86_400;
const MAX_ALERT_RULES = 10;
const MAX_ALERT_WEBHOOKS = 5;
const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/services/";

/** A request as a browser route interceptor sees it. Header names may use any case. */
export type FakeCustdRequest = { method: string; url: string; headers: Record<string, string>; body: string | null };

export type FakeCustdResponse = { status: number; headers: Record<string, string>; body?: string };

/** One answered request, with lowercase header names and the parsed JSON body when there is one. */
export type FakeCustdRecordedRequest = FakeCustdRequest & { path: string; json?: unknown };

/** One event the hosted app's tracker was handed. */
export type FakeTrackedEvent = { eventTypeSlug: string; payload?: Record<string, unknown> };

/** One error the hosted app's error capture was handed; the error itself is reduced to its type, as Custd would. */
export type FakeCapturedError = {
  exceptionType: string;
  mode?: CaptureExceptionRequest["mode"];
  correlationId?: string;
};

export type FakeCustdOptions = {
  /** The app's origin; the API is served under `/__custd` on it. Defaults to `https://app.custd.test`. */
  origin?: string;
  siteKey?: string;
  /** The sign-in public client's id. */
  clientId?: string;
  /** Defaults to every capability: tracking and error capture are recorded, never sent. */
  capabilities?: HostedAppCapability[];
  /** The clock every timestamp and estimate age uses. Defaults to `Date.now`. */
  now?: () => number;
  /** False makes alert email subscriptions refuse with `app_alert_no_verified_email`. */
  signedInUsersHaveVerifiedEmail?: boolean;
};

type StoredLink = AppItemLink & { token: string; itemUuid: string };

type StoredAlerts = {
  rules: AppAlertRule[];
  webhooks: AppAlertWebhook[];
  subscriptions: Map<string, AppAlertSubscription>;
  deliveries: AppAlertDelivery[];
};

type StoredItem = {
  uuid: string;
  kind: AppItemKind;
  version: number;
  changeSequence: number;
  idleExpirySeconds: number;
  updatedAt: string;
  ownerUser: string | null;
  project?: AppMeasurementProject;
  model?: AppUncertaintyModel;
  meeting?: AppMeeting;
  modelRuns: AppModelRun[];
  observations: FakeObservation[];
  estimates: AppProjectEstimate[];
  entries: AppLinkCollectionEntry[];
  runs: AppForecastRun[];
  alerts: StoredAlerts;
};

type Caller = { item: StoredItem; role: AppLinkRole; user: string | null };

type RouteContext = { request: FakeCustdRecordedRequest; url: URL; path: string; user: string | null };

type Route = (context: RouteContext) => FakeCustdResponse;

const json = (status: number, body: unknown, headers: Record<string, string> = {}): FakeCustdResponse => ({
  status,
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});

const noContent = (): FakeCustdResponse => ({ status: 204, headers: {} });

function lowercaseHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));
}

function parseJson(body: string | null): unknown {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/** Sign-in storage held in memory, for tests that have no `sessionStorage`. */
export function memorySignInStorage(): SignInStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
}

/** Signs `user` in through the real PKCE flow of `signIn`, against the fake's authorize and token endpoints. */
export async function signInWithFake(fake: FakeCustd, signIn: BrowserSignIn, user?: string): Promise<SignInSession> {
  const start = await signIn.startSignIn();
  const completion = await signIn.completeSignIn(fake.authorize(start.authorizationUrl, user));
  return completion.session;
}

export class FakeCustd {
  readonly origin: string;
  readonly apiBaseUrl: string;
  readonly siteKey: string;
  /** Every request the fake answered, oldest first. */
  readonly requests: FakeCustdRecordedRequest[] = [];
  /** Every event the hosted app tracked, oldest first. Page views appear as `page-view`. */
  readonly trackedEvents: FakeTrackedEvent[] = [];
  /** Every error the hosted app captured, oldest first. */
  readonly capturedErrors: FakeCapturedError[] = [];
  private readonly clientId: string;
  private readonly capabilities: HostedAppCapability[];
  private readonly now: () => number;
  private readonly verifiedEmail: boolean;
  private readonly items = new Map<string, StoredItem>();
  private readonly links = new Map<string, StoredLink>();
  private readonly codes = new Map<string, string>();
  private readonly routes: Record<string, Route>;
  private sequence = 0;
  private userCount = 0;

  constructor(options: FakeCustdOptions = {}) {
    this.origin = (options.origin ?? FAKE_CUSTD_ORIGIN).replace(/\/+$/, "");
    this.apiBaseUrl = `${this.origin}${FAKE_CUSTD_API_PATH}`;
    this.siteKey = options.siteKey ?? FAKE_CUSTD_SITE_KEY;
    this.clientId = options.clientId ?? "custd-fake-app";
    this.capabilities = options.capabilities ?? Object.values(HOSTED_APP_CAPABILITIES);
    this.now = options.now ?? Date.now;
    this.verifiedEmail = options.signedInUsersHaveVerifiedEmail ?? true;
    this.routes = { ...this.itemRoutes(), ...this.resultRoutes(), ...this.alertRoutes() };
  }

  discovery(): HostedAppDiscovery {
    return {
      apiBaseUrl: this.apiBaseUrl,
      host: new URL(this.origin).host,
      siteUuid: "00000000-0000-4000-8000-000000000001",
      browserKey: this.siteKey,
      environment: "test",
      capabilities: [...this.capabilities],
      identityMode: "cookieless",
      allowedOrigins: [this.origin],
      pageViewSchemaVersion: "1.0.0",
      signIn: {
        issuer: this.origin,
        authorizationEndpoint: `${this.origin}${FAKE_CUSTD_AUTH_PATH}/authorize`,
        tokenEndpoint: `${this.origin}${FAKE_CUSTD_AUTH_PATH}/token`,
        clientId: this.clientId,
        audience: "custd-fake-app",
        redirectUri: `${this.origin}/auth/callback`,
      },
    };
  }

  /** Options for `startHostedApp` (or `CustdHostedAppProvider`) that reach this fake. */
  hostedAppOptions(): HostedAppOptions {
    return {
      discoveryUrl: `${this.origin}${HOSTED_APP_DISCOVERY_PATH}`,
      fetch: this.fetch,
      signInStorage: memorySignInStorage(),
      createTracker: () => this.recordingTracker(),
      startErrorCapture: () => ({ client: this.recordingErrorCapture(), uninstall: () => {} }),
    };
  }

  // The tracker and error capture record what the app hands them and touch no page globals.
  private recordingTracker(): BrowserTracker {
    const record = async (eventTypeSlug: string, payload?: Record<string, unknown>) => {
      this.trackedEvents.push(payload === undefined ? { eventTypeSlug } : { eventTypeSlug, payload });
    };
    return {
      track: record,
      trackPageView: () => record("page-view"),
      installSpaTracking: () => {},
      setConsent: () => {},
      flush: async () => {},
      close: () => {},
    };
  }

  private recordingErrorCapture(): HostedAppErrorCapture {
    return {
      captureException: async (request) => {
        const exceptionType = request.error instanceof Error ? request.error.name : "Error";
        this.capturedErrors.push({
          exceptionType,
          ...(request.mode ? { mode: request.mode } : {}),
          ...(request.correlationId ? { correlationId: request.correlationId } : {}),
        });
        return { outcome: "accepted" };
      },
    };
  }

  /** A client that reaches this fake; `userToken` is the signed-in user, as the fake names them. */
  appItemsClient(options: { userToken?: string } = {}): AppItemsClient {
    return AppItemsClient.fromDiscovery(this.discovery(), { fetch: this.fetch, userToken: () => options.userToken });
  }

  /** Approves a sign-in as `user` (a new user when absent) and returns the redirect back to the app. */
  authorize(authorizationUrl: string, user?: string): string {
    const url = new URL(authorizationUrl);
    const code = this.token();
    this.userCount += 1;
    this.codes.set(code, user ?? `user-${this.userCount}`);
    const back = new URL(url.searchParams.get("redirect_uri") ?? `${this.origin}/auth/callback`);
    back.searchParams.set("code", code);
    back.searchParams.set("state", url.searchParams.get("state") ?? "");
    return back.toString();
  }

  /** The fake as a `fetch`, for the SDK's clients. */
  readonly fetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const headers: Record<string, string> = {};
    request.headers.forEach((value, name) => {
      headers[name] = value;
    });
    const text = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
    const answer = this.handle({ method: request.method, url: request.url, headers, body: text === "" ? null : text });
    return new Response(answer.body ?? null, { status: answer.status, headers: answer.headers });
  };

  /** Answers one request, as a browser route interceptor hands it over. */
  handle(raw: FakeCustdRequest): FakeCustdResponse {
    const url = new URL(raw.url);
    const request: FakeCustdRecordedRequest = {
      ...raw,
      headers: lowercaseHeaders(raw.headers),
      path: url.pathname.startsWith(FAKE_CUSTD_API_PATH)
        ? url.pathname.slice(FAKE_CUSTD_API_PATH.length)
        : url.pathname,
      json: parseJson(raw.body),
    };
    this.requests.push(request);
    try {
      return this.dispatch(request, url);
    } catch (error) {
      if (!(error instanceof FakeCustdProblem)) throw error;
      return json(error.status, { status: error.status, code: error.code, title: error.code });
    }
  }

  private dispatch(request: FakeCustdRecordedRequest, url: URL): FakeCustdResponse {
    if (url.pathname === HOSTED_APP_DISCOVERY_PATH) return json(200, this.discovery());
    if (url.pathname.startsWith(FAKE_CUSTD_AUTH_PATH)) return this.auth(request, url);
    if (!url.pathname.startsWith(FAKE_CUSTD_API_PATH)) return json(404, { code: "not_found" });
    if (request.method === "OPTIONS") return noContent();
    if (request.headers[APP_ITEM_SITE_KEY_HEADER.toLowerCase()] !== this.siteKey) {
      throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.keyRefused);
    }
    const user = request.headers[APP_ITEM_USER_TOKEN_HEADER.toLowerCase()] ?? null;
    const context = { request, url, path: request.path, user };
    const route = this.routes[`${request.method} ${request.path}`];
    return route ? route(context) : this.routeWithId(context);
  }

  // ---- Sign-in ----

  private auth(request: FakeCustdRecordedRequest, url: URL): FakeCustdResponse {
    if (url.pathname.endsWith("/authorize"))
      return { status: 302, headers: { location: this.authorize(url.toString()) } };
    const form = new URLSearchParams(request.body ?? "");
    const code = form.get("code") ?? "";
    const user = this.codes.get(code) ?? form.get("refresh_token")?.replace(/^refresh-/, "");
    this.codes.delete(code);
    if (!user) return json(400, { error: "invalid_grant" });
    return json(200, {
      access_token: user,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: `refresh-${user}`,
      scope: "openid profile offline_access",
    });
  }

  // ---- Routes ----

  private itemRoutes(): Record<string, Route> {
    const base = "/api/v1/app/item";
    return {
      "POST /api/v1/app/items": (c) => json(201, this.create(c.request.json as AppItemCreateRequest, c.user)),
      "GET /api/v1/app/items": (c) => json(200, { items: this.mine(c.user) }),
      [`GET ${base}`]: (c) => this.itemRead(c),
      [`PATCH ${base}`]: (c) => this.change(c, (item) => this.settings(item, c.request.json as AppItemSettingsRequest)),
      [`POST ${base}/claim`]: (c) => json(200, this.claim(this.caller(c))),
      [`POST ${base}/measurements`]: (c) => this.measure(c, (c.request.json as AppMeasurementBulkRequest).rows),
      [`POST ${base}/measurements/csv`]: (c) => this.measure(c, csvRows((c.request.json as { csv: string }).csv)),
      [`POST ${base}/estimates`]: (c) => json(201, this.estimate(c, c.request.json as AppEstimateCreateRequest)),
      [`POST ${base}/complete`]: (c) =>
        this.change(c, (item) => this.complete(item, (c.request.json as AppProjectCompleteRequest).completedAt)),
      [`POST ${base}/cancel`]: (c) => this.change(c, (item) => this.setStatus(item, "canceled")),
      [`POST ${base}/reopen`]: (c) => this.change(c, (item) => this.setStatus(item, "active")),
      [`POST ${base}/entries`]: (c) => json(201, this.addEntry(c, c.request.json as AppLinkCollectionEntryAddRequest)),
      [`POST ${base}/meeting/start`]: (c) =>
        this.change(c, (item) => startFakeMeeting(this.meetingOf(item), this.now())),
      [`POST ${base}/meeting/advance`]: (c) => this.advance(c, c.request.json as AppMeetingAdvanceRequest),
      [`POST ${base}/meeting/end`]: (c) => this.change(c, (item) => endFakeMeeting(this.meetingOf(item), this.now())),
    };
  }

  private resultRoutes(): Record<string, Route> {
    return {
      "POST /api/v1/app/forecast/runs": (c) => json(201, this.runForecast(c, c.request.json as AppForecastRunRequest)),
      "GET /api/v1/app/forecast/latest": (c) => this.latestForecast(c),
      "GET /api/v1/app/forecast/story": (c) => this.story(c),
      "POST /api/v1/app/item/model/versions": (c) => {
        const body = c.request.json as AppModelVersionCreateRequest;
        return this.change(c, (item) => this.saveVersion(item, body.quantities, body.note ?? ""), 201);
      },
      "POST /api/v1/app/item/model/copy": (c) => json(201, this.copyModel(c, c.request.json as AppModelCopyRequest)),
      "POST /api/v1/app/models/runs": (c) => json(201, this.runModel(c, c.request.json as AppModelRunRequest)),
      "POST /api/v1/app/models/calculate": (c) =>
        json(200, this.calculate(this.caller(c), c.request.json as AppModelCalculateRequest)),
      "GET /api/v1/app/models/latest": (c) => this.latestModelRun(c),
    };
  }

  private alertRoutes(): Record<string, Route> {
    const base = "/api/v1/app/item/alerts";
    return {
      [`GET ${base}`]: (c) => json(200, this.alertSettings(this.caller(c))),
      [`GET ${base}/deliveries`]: (c) =>
        json(200, { deliveries: [...this.owned(this.caller(c)).alerts.deliveries].reverse() }),
      [`POST ${base}/rules`]: (c) =>
        json(201, this.addRule(this.owned(this.caller(c)), c.request.json as AppAlertRuleSpec)),
      [`POST ${base}/webhooks`]: (c) =>
        json(201, this.addWebhook(this.owned(this.caller(c)), c.request.json as AppAlertWebhookCreateRequest)),
      [`POST ${base}/slack`]: (c) =>
        json(201, this.addSlack(this.owned(this.caller(c)), c.request.json as AppAlertSlackCreateRequest)),
      [`PUT ${base}/subscription`]: (c) => json(200, this.subscribe(this.caller(c))),
      [`DELETE ${base}/subscription`]: (c) => {
        this.owned(this.caller(c)).alerts.subscriptions.delete(c.user ?? "");
        return noContent();
      },
    };
  }

  private routeWithId(context: RouteContext): FakeCustdResponse {
    const run = /^\/api\/v1\/app\/forecast\/runs\/([^/]+)$/.exec(context.path);
    if (run && context.request.method === "GET") return this.forecastRun(context, run[1] ?? "");
    const match = /^\/api\/v1\/app\/item\/(entries|links|alerts\/rules|alerts\/webhooks)\/([^/]+)(\/rotate)?$/.exec(
      context.path,
    );
    if (!match) throw new FakeCustdProblem(404, "not_found");
    const [, collection, id = "", rotate] = match;
    const item = this.owned(this.caller(context));
    if (collection === "links" && rotate && context.request.method === "POST") return json(200, this.rotate(item, id));
    if (context.request.method !== "DELETE" || rotate) throw new FakeCustdProblem(405, "method_not_allowed");
    this.remove(item, collection ?? "", id);
    return noContent();
  }

  private remove(item: StoredItem, collection: string, id: string): void {
    if (collection === "links") this.revoke(item, id);
    if (collection === "entries") item.entries = item.entries.filter((entry) => entry.entryUuid !== id);
    if (collection === "alerts/rules") item.alerts.rules = item.alerts.rules.filter((rule) => rule.ruleUuid !== id);
    if (collection === "alerts/webhooks") {
      item.alerts.webhooks = item.alerts.webhooks.filter((hook) => hook.webhookUuid !== id);
    }
    this.touch(item);
  }

  private conditional(context: RouteContext, etag: string, body: () => unknown): FakeCustdResponse {
    if (context.request.headers["if-none-match"] === etag) return { status: 304, headers: { etag } };
    return json(200, body(), { etag });
  }

  // ---- Callers ----

  private caller(context: RouteContext): Caller {
    const bearer = context.request.headers.authorization?.replace(/^Bearer /, "");
    const itemParam = context.url.searchParams.get("item");
    if (bearer) return this.linkCaller(bearer, itemParam, context.user);
    if (!context.user) throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
    const item = itemParam ? this.items.get(itemParam) : undefined;
    if (item && item.ownerUser === context.user) return { item, role: APP_LINK_ROLES.owner, user: context.user };
    const viaOwnedCollection = [...this.items.values()].some(
      (candidate) =>
        candidate.ownerUser === context.user && candidate.entries.some((entry) => entry.itemUuid === itemParam),
    );
    if (item && viaOwnedCollection) return { item, role: APP_LINK_ROLES.share, user: context.user };
    throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
  }

  private linkCaller(token: string, itemParam: string | null, user: string | null): Caller {
    const link = this.links.get(token);
    const item = link ? this.items.get(link.itemUuid) : undefined;
    if (!link || !item) throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.linkRefused);
    if (!itemParam || itemParam === item.uuid) return { item, role: link.role, user };
    const entry = item.entries.find((candidate) => candidate.itemUuid === itemParam);
    const target = entry ? this.items.get(entry.itemUuid) : undefined;
    if (!target) throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
    return { item: target, role: APP_LINK_ROLES.share, user };
  }

  private owned(caller: Caller): StoredItem {
    if (caller.role !== APP_LINK_ROLES.owner) throw new FakeCustdProblem(403, APP_ITEM_ERROR_CODES.readOnlyLink);
    return caller.item;
  }

  private touch(item: StoredItem): void {
    item.version += 1;
    item.changeSequence = this.nextSequence();
    item.updatedAt = new Date(this.now()).toISOString();
  }

  private change(context: RouteContext, apply: (item: StoredItem) => void, status = 200): FakeCustdResponse {
    const caller = this.caller(context);
    apply(this.owned(caller));
    this.touch(caller.item);
    return json(status, this.read(caller));
  }

  // ---- Ids ----

  private nextSequence(): number {
    this.sequence += 1;
    return this.sequence;
  }

  private uuid(): string {
    return `00000000-0000-4000-8000-${this.nextSequence().toString(16).padStart(12, "0")}`;
  }

  /** 43 base64url characters, the shape of a real link token. */
  private token(): string {
    return `fake${this.nextSequence()}`.padStart(43, "A");
  }

  private nowIso(): string {
    return new Date(this.now()).toISOString();
  }

  // ---- Items ----

  private create(request: AppItemCreateRequest, user: string | null): AppItemCreated {
    const item = this.newItem(request.kind, request.idleExpirySeconds, user);
    if (request.kind === APP_ITEM_KINDS.uncertaintyModel) {
      const create = request.uncertaintyModel;
      item.model = this.newModel(create.name, create.description ?? "");
      if (create.quantities) this.saveVersion(item, create.quantities, create.note ?? "");
    }
    if (request.kind === APP_ITEM_KINDS.measurementProject) item.project = this.newProject(item, request);
    if (request.kind === APP_ITEM_KINDS.meeting) item.meeting = fakeMeeting(request.meeting, () => this.uuid());
    return this.issueLinks(item);
  }

  private newItem(kind: AppItemKind, idleExpirySeconds: number | undefined, user: string | null): StoredItem {
    const item: StoredItem = {
      uuid: this.uuid(),
      kind,
      version: 1,
      changeSequence: this.nextSequence(),
      idleExpirySeconds: idleExpirySeconds ?? DEFAULT_IDLE_SECONDS,
      updatedAt: this.nowIso(),
      ownerUser: user,
      observations: [],
      estimates: [],
      entries: [],
      runs: [],
      modelRuns: [],
      alerts: { rules: [], webhooks: [], subscriptions: new Map(), deliveries: [] },
    };
    this.items.set(item.uuid, item);
    return item;
  }

  private issueLinks(item: StoredItem): AppItemCreated {
    const ownerToken = this.issue(item.uuid, APP_LINK_ROLES.owner);
    const shareToken = this.issue(item.uuid, APP_LINK_ROLES.share);
    return { item: this.read({ item, role: APP_LINK_ROLES.owner, user: item.ownerUser }), ownerToken, shareToken };
  }

  private newModel(name: string, description: string): AppUncertaintyModel {
    const now = this.nowIso();
    return { modelUuid: this.uuid(), name, description, latestVersion: 0, createdAt: now, updatedAt: now };
  }

  private newProject(
    item: StoredItem,
    request: Extract<AppItemCreateRequest, { kind: "measurement_project" }>,
  ): AppMeasurementProject {
    const create = request.measurementProject;
    const now = this.nowIso();
    return {
      projectUuid: this.uuid(),
      projectCode: `app-${item.uuid.slice(-8)}`,
      kind: create.kind,
      status: "active",
      name: create.name,
      description: create.description ?? "",
      series: create.series.map((series) => ({ ...series, seriesUuid: this.uuid() })),
      target: { ...create.target, targetUuid: this.uuid() },
      delivery: { definitionOfDone: "" },
      run: { similar: true },
      createdAt: now,
      updatedAt: now,
    };
  }

  private issue(itemUuid: string, role: AppLinkRole): string {
    const token = this.token();
    this.links.set(token, { token, itemUuid, role, linkUuid: this.uuid(), createdAt: this.nowIso() });
    return token;
  }

  private rotate(item: StoredItem, linkUuid: string): AppItemLinkRotated {
    const old = this.linkOf(item, linkUuid);
    this.links.delete(old.token);
    const token = this.issue(item.uuid, old.role);
    const { linkUuid: newUuid, role, createdAt } = this.links.get(token) ?? old;
    this.touch(item);
    return { link: { linkUuid: newUuid, role, createdAt }, token };
  }

  private revoke(item: StoredItem, linkUuid: string): void {
    this.links.delete(this.linkOf(item, linkUuid).token);
  }

  private linkOf(item: StoredItem, linkUuid: string): StoredLink {
    const link = [...this.links.values()].find((c) => c.itemUuid === item.uuid && c.linkUuid === linkUuid);
    if (!link) throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
    return link;
  }

  private itemRead(context: RouteContext): FakeCustdResponse {
    const caller = this.caller(context);
    return this.conditional(context, `"${caller.item.version}"`, () => this.read(caller));
  }

  private read(caller: Caller): AppItemRead {
    const { item } = caller;
    const read: AppItemRead = {
      item: {
        itemUuid: item.uuid,
        kind: item.kind,
        role: caller.role,
        ownership: this.ownership(item, caller.user),
        version: item.version,
        idleExpirySeconds: item.idleExpirySeconds,
        updatedAt: item.updatedAt,
        expiresAt: new Date(Date.parse(item.updatedAt) + item.idleExpirySeconds * 1000).toISOString(),
      },
    };
    if (caller.role === APP_LINK_ROLES.owner) read.links = this.linksOf(item);
    if (item.project) {
      read.measurementProject = structuredClone(item.project);
      read.estimates = fakeEstimateList(item.estimates, item.project.delivery.targetDate, this.now());
    }
    if (item.kind === APP_ITEM_KINDS.linkCollection) read.linkCollection = { entries: [...item.entries] };
    if (item.model) read.uncertaintyModel = structuredClone(item.model);
    if (item.meeting) read.meeting = structuredClone(item.meeting);
    return read;
  }

  private ownership(item: StoredItem, user: string | null): AppItemRead["item"]["ownership"] {
    if (item.ownerUser === null) return APP_ITEM_OWNERSHIPS.unowned;
    return item.ownerUser === user ? APP_ITEM_OWNERSHIPS.yours : APP_ITEM_OWNERSHIPS.other;
  }

  private linksOf(item: StoredItem): AppItemLink[] {
    return [...this.links.values()]
      .filter((link) => link.itemUuid === item.uuid)
      .map(({ linkUuid, role, createdAt }) => ({ linkUuid, role, createdAt }));
  }

  private mine(user: string | null): AppItemSummary[] {
    if (!user) throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
    return [...this.items.values()]
      .filter((item) => item.ownerUser === user)
      .sort((a, b) => b.changeSequence - a.changeSequence)
      .map((item) => ({
        ...this.read({ item, role: APP_LINK_ROLES.owner, user }).item,
        name: item.project?.name ?? item.meeting?.name ?? item.model?.name ?? "",
        status: item.project?.status ?? item.meeting?.status ?? "",
      }));
  }

  private claim(caller: Caller): AppItemRead {
    const item = this.owned(caller);
    if (!caller.user) throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
    if (item.ownerUser !== null && item.ownerUser !== caller.user) {
      throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.claimed);
    }
    item.ownerUser = caller.user;
    this.touch(item);
    return this.read(caller);
  }

  private projectOf(item: StoredItem): AppMeasurementProject {
    if (!item.project) throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
    return item.project;
  }

  private meetingOf(item: StoredItem): AppMeeting {
    if (!item.meeting) throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
    return item.meeting;
  }

  private settings(item: StoredItem, request: AppItemSettingsRequest): void {
    if (request.idleExpirySeconds !== undefined) item.idleExpirySeconds = request.idleExpirySeconds;
    const change = request.project;
    if (!change) return;
    const project = this.projectOf(item);
    if (change.name !== undefined) project.name = change.name;
    if (change.description !== undefined) project.description = change.description;
    if (change.status !== undefined) project.status = change.status;
    if (change.definitionOfDone !== undefined) project.delivery.definitionOfDone = change.definitionOfDone;
    if (change.deliveryTargetDate !== undefined) project.delivery.targetDate = change.deliveryTargetDate;
    if (change.forecastMethod !== undefined) project.run.forecastMethod = change.forecastMethod;
    if (change.runSimilar !== undefined) project.run.similar = change.runSimilar;
  }

  private complete(item: StoredItem, completedAt: string): void {
    const project = this.projectOf(item);
    project.status = "completed";
    project.delivery.completedAt = completedAt;
    if (project.target) project.target.state = "completed";
  }

  private setStatus(item: StoredItem, status: "active" | "canceled"): void {
    const project = this.projectOf(item);
    project.status = status;
    if (status === "active" && project.target) project.target.state = "active";
  }

  private measure(context: RouteContext, rows: FakeObservation[]): FakeCustdResponse {
    const item = this.owned(this.caller(context));
    const project = this.projectOf(item);
    item.observations.push(...rows.map((row) => ({ observedAt: row.observedAt, value: row.value })));
    const response: AppMeasurementBulkResponse = {
      importId: this.uuid(),
      accepted: rows.length,
      rejected: 0,
      results: rows.map((_, rowIndex) => ({ rowIndex, success: true, observationUuid: this.uuid() })),
    };
    const target = project.target;
    if (target?.state === "active" && rows.some((row) => row.value >= target.targetValue)) {
      target.state = "completed";
      target.completedAt = this.nowIso();
      response.completedTargetUuid = target.targetUuid;
    }
    this.touch(item);
    this.evaluateAlerts(item);
    return json(200, response);
  }

  private estimate(context: RouteContext, request: AppEstimateCreateRequest): AppProjectEstimate {
    const item = this.owned(this.caller(context));
    this.projectOf(item);
    const estimate: AppProjectEstimate = {
      estimateUuid: this.uuid(),
      estimatedAt: request.estimatedAt ?? this.nowIso(),
      lowDate: request.lowDate,
      highDate: request.highDate,
      note: request.note ?? "",
    };
    item.estimates.push(estimate);
    this.touch(item);
    this.evaluateAlerts(item);
    return estimate;
  }

  private addEntry(context: RouteContext, request: AppLinkCollectionEntryAddRequest): AppLinkCollectionEntry {
    const item = this.owned(this.caller(context));
    if (item.kind !== APP_ITEM_KINDS.linkCollection) throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
    const link = this.links.get(request.token);
    const target = link ? this.items.get(link.itemUuid) : undefined;
    if (!target) throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
    if (target.kind === APP_ITEM_KINDS.linkCollection) {
      throw new FakeCustdProblem(422, APP_ITEM_ERROR_CODES.notCollectable);
    }
    const entry: AppLinkCollectionEntry = {
      entryUuid: this.uuid(),
      itemUuid: target.uuid,
      kind: target.kind,
      position: item.entries.length,
      createdAt: this.nowIso(),
    };
    item.entries.push(entry);
    this.touch(item);
    return entry;
  }

  private advance(context: RouteContext, request: AppMeetingAdvanceRequest): FakeCustdResponse {
    const caller = this.caller(context);
    const item = this.owned(caller);
    if (advanceFakeMeeting(this.meetingOf(item), request.blockUuid, this.now())) this.touch(item);
    return json(200, this.read(caller));
  }

  // ---- Forecasts ----

  private runForecast(context: RouteContext, request: AppForecastRunRequest): AppForecastRun {
    const item = this.owned(this.caller(context));
    const meta = { runUuid: this.uuid(), now: this.now() };
    const run = fakeForecastRun(this.projectOf(item), item.observations, request ?? {}, meta);
    item.runs.push(run);
    this.evaluateAlerts(item);
    return run;
  }

  private latestForecast(context: RouteContext): FakeCustdResponse {
    const { item } = this.caller(context);
    const run = fromEnd(item.runs, 1);
    if (!run) throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.forecastMissing);
    return this.conditional(context, `"run-${item.runs.length}"`, () => run);
  }

  private forecastRun(context: RouteContext, runUuid: string): FakeCustdResponse {
    const run = this.caller(context).item.runs.find((candidate) => candidate.forecastRunUuid === runUuid);
    if (!run) throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.forecastMissing);
    return this.conditional(context, `"${run.forecastRunUuid}"`, () => run);
  }

  private story(context: RouteContext): FakeCustdResponse {
    const { item } = this.caller(context);
    const project = this.projectOf(item);
    return this.conditional(context, `"${item.version}"`, () =>
      fakeForecastStory(project, item.observations, this.now()),
    );
  }

  // ---- Models ----

  private saveVersion(item: StoredItem, quantities: AppModelQuantity[], note: string): void {
    const model = item.model;
    if (!model) throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
    model.latestVersion += 1;
    model.updatedAt = this.nowIso();
    model.version = {
      versionUuid: this.uuid(),
      versionNumber: model.latestVersion,
      note,
      quantities: structuredClone(quantities),
      createdAt: this.nowIso(),
    };
  }

  private modelVersion(item: StoredItem): { model: AppUncertaintyModel; quantities: AppModelQuantity[] } {
    const model = item.model;
    if (!model?.version) throw new FakeCustdProblem(409, APP_MODEL_ERROR_CODES.runInvalid);
    return { model, quantities: model.version.quantities };
  }

  private copyModel(context: RouteContext, request: AppModelCopyRequest): AppItemCreated {
    const source = this.owned(this.caller(context));
    const { model, quantities } = this.modelVersion(source);
    const copy = this.newItem(APP_ITEM_KINDS.uncertaintyModel, source.idleExpirySeconds, context.user);
    copy.model = this.newModel(request.name ?? `Copy of ${model.name}`, model.description);
    this.saveVersion(copy, quantities, "");
    return this.issueLinks(copy);
  }

  private runModel(context: RouteContext, request: AppModelRunRequest): AppModelRun {
    const item = this.owned(this.caller(context));
    const { model, quantities } = this.modelVersion(item);
    const output = request.sensitivityOutput ?? request.decision?.output;
    const run: AppModelRun = {
      runUuid: this.uuid(),
      modelUuid: model.modelUuid,
      versionNumber: model.latestVersion,
      trigger: "request",
      seed: request.seed,
      sampleCount: request.sampleCount ?? 10_000,
      createdAt: this.nowIso(),
      quantities: fakeModelResults(quantities),
      boundInputs: [],
      ...(request.decision ? { decision: request.decision } : {}),
      ...(output ? { sensitivityOutput: output, sensitivity: fakeSensitivity(quantities, output) } : {}),
    };
    item.modelRuns.push(run);
    this.touch(item);
    return run;
  }

  private calculate(caller: Caller, request: AppModelCalculateRequest): AppModelCalculateResult {
    const { model, quantities } = this.modelVersion(caller.item);
    const overrides = new Map((request.inputs ?? []).map((input) => [input.name, input.input]));
    const changed = quantities.map((quantity): AppModelQuantity => {
      const input = overrides.get(quantity.name);
      return input && quantity.kind === "input" ? { ...quantity, input } : quantity;
    });
    const outputs = new Set(request.outputs);
    return {
      modelUuid: model.modelUuid,
      versionNumber: model.latestVersion,
      seed: request.seed ?? 1,
      sampleCount: request.sampleCount ?? 10_000,
      quantities: fakeModelResults(changed).filter((result) => outputs.has(result.name)),
    };
  }

  private latestModelRun(context: RouteContext): FakeCustdResponse {
    const { item } = this.caller(context);
    const run = fromEnd(item.modelRuns, 1);
    if (!run) throw new FakeCustdProblem(404, APP_MODEL_ERROR_CODES.runMissing);
    return this.conditional(context, `"model-run-${item.modelRuns.length}"`, () => run);
  }

  // ---- Alerts ----

  private alertSettings(caller: Caller): AppAlertSettings {
    const { alerts } = this.owned(caller);
    const subscription = caller.user ? alerts.subscriptions.get(caller.user) : undefined;
    return {
      rules: [...alerts.rules],
      webhooks: [...alerts.webhooks],
      ...(subscription ? { subscription } : {}),
      deliveryAvailable: true,
    };
  }

  private addRule(item: StoredItem, spec: AppAlertRuleSpec): AppAlertRule {
    if (item.alerts.rules.length >= MAX_ALERT_RULES) throw new FakeCustdProblem(409, APP_ALERT_ERROR_CODES.limit);
    if (!Object.values(APP_ALERT_RULE_TYPES).includes(spec.type)) {
      throw new FakeCustdProblem(400, APP_ALERT_ERROR_CODES.ruleInvalid);
    }
    const rule: AppAlertRule = {
      ...spec,
      ruleUuid: this.uuid(),
      conditionMet: false,
      crossings: 0,
      createdAt: this.nowIso(),
    };
    item.alerts.rules.push(rule);
    return rule;
  }

  private addWebhook(item: StoredItem, request: AppAlertWebhookCreateRequest): AppAlertWebhookCreated {
    if (item.alerts.webhooks.length >= MAX_ALERT_WEBHOOKS) throw new FakeCustdProblem(409, APP_ALERT_ERROR_CODES.limit);
    if (!request.endpoint.startsWith("https://")) throw new FakeCustdProblem(400, APP_ITEM_ERROR_CODES.invalid);
    const webhook: AppAlertWebhook = {
      webhookUuid: this.uuid(),
      kind: APP_ALERT_DESTINATION_KINDS.webhook,
      endpoint: request.endpoint,
      createdAt: this.nowIso(),
    };
    item.alerts.webhooks.push(webhook);
    return { webhook, signingSecret: `whsec_${this.token()}` };
  }

  // A Slack destination shares the webhook bound and removal; like Custd, only a hint of its URL is kept.
  private addSlack(item: StoredItem, request: AppAlertSlackCreateRequest): AppAlertWebhook {
    if (item.alerts.webhooks.length >= MAX_ALERT_WEBHOOKS) throw new FakeCustdProblem(409, APP_ALERT_ERROR_CODES.limit);
    if (!request.webhookUrl.startsWith(SLACK_WEBHOOK_PREFIX))
      throw new FakeCustdProblem(400, APP_ITEM_ERROR_CODES.invalid);
    const hint = `${request.webhookUrl.slice("https://".length).split("/").slice(0, 3).join("/")}/…`;
    const slack: AppAlertWebhook = {
      webhookUuid: this.uuid(),
      kind: APP_ALERT_DESTINATION_KINDS.slack,
      endpoint: hint,
      createdAt: this.nowIso(),
    };
    item.alerts.webhooks.push(slack);
    return slack;
  }

  private subscribe(caller: Caller): AppAlertSubscription {
    const item = this.owned(caller);
    if (!caller.user) throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
    if (!this.verifiedEmail) throw new FakeCustdProblem(422, APP_ALERT_ERROR_CODES.noVerifiedEmail);
    const existing = item.alerts.subscriptions.get(caller.user);
    if (existing) return existing;
    const subscription = { subscriptionUuid: this.uuid(), createdAt: this.nowIso() };
    item.alerts.subscriptions.set(caller.user, subscription);
    return subscription;
  }

  private conditionMet(item: StoredItem, rule: AppAlertRule): boolean {
    const target = item.project?.target;
    const counter = fromEnd(item.runs, 1)?.counter;
    if (rule.type === APP_ALERT_RULE_TYPES.targetReached) return target?.state === "completed";
    if (rule.type === APP_ALERT_RULE_TYPES.deadlineProbabilityBelow) {
      return counter?.deadlineProbability !== undefined && counter.deadlineProbability < (rule.threshold ?? 0);
    }
    if (rule.type === APP_ALERT_RULE_TYPES.forecastMovedInsideTarget) {
      const upper = counter?.completionInterval?.upper;
      return upper !== undefined && !!target?.targetDate && Date.parse(upper) <= Date.parse(target.targetDate);
    }
    const latest = fromEnd(item.estimates, 1);
    return latest !== undefined && this.now() - Date.parse(latest.estimatedAt) > (rule.staleDays ?? 0) * 86_400_000;
  }

  private evaluateAlerts(item: StoredItem): void {
    for (const rule of item.alerts.rules) {
      const met = this.conditionMet(item, rule);
      if (met && !rule.conditionMet) {
        rule.crossings += 1;
        this.deliver(item, rule);
      }
      rule.conditionMet = met;
    }
  }

  private deliver(item: StoredItem, rule: AppAlertRule): void {
    const now = this.nowIso();
    const delivery = (channel: AppAlertDelivery["channel"], webhookUuid?: string): AppAlertDelivery => ({
      deliveryUuid: this.uuid(),
      ruleUuid: rule.ruleUuid,
      ruleType: rule.type,
      crossing: rule.crossings,
      channel,
      ...(webhookUuid ? { webhookUuid } : {}),
      outcome: APP_ALERT_DELIVERY_OUTCOMES.sent,
      attempts: 1,
      createdAt: now,
      updatedAt: now,
    });
    for (const hook of item.alerts.webhooks)
      item.alerts.deliveries.push(delivery(APP_ALERT_CHANNELS[hook.kind], hook.webhookUuid));
    for (const _ of item.alerts.subscriptions.values()) item.alerts.deliveries.push(delivery(APP_ALERT_CHANNELS.email));
  }
}

/** `observedAt,value` lines; a first line that is not a measurement is read as the header. */
function csvRows(csv: string): FakeObservation[] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.split(","))
    .filter(([observedAt, value]) => observedAt && value !== undefined && !Number.isNaN(Number(value)))
    .map(([observedAt = "", value]) => ({ observedAt: observedAt.trim(), value: Number(value) }));
}
