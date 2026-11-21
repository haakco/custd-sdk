// An in-memory Custd for app tests: the hosted app discovery file, the /api/v1/app/ item, link,
// measurement, estimate, forecast, model, alert and meeting routes, and a PKCE sign-in. It answers
// at the wire level (`handle`, for a browser route interceptor) and as a `fetch` (for the SDK's own
// clients), records every request, and builds every answer from the SDK's DTOs, so a contract
// change fails the typecheck here first. Results are deterministic and deliberately simple.
import { APP_ALERT_CHANNELS, APP_ALERT_DELIVERY_OUTCOMES, APP_ALERT_DESTINATION_KINDS, APP_ALERT_ERROR_CODES, APP_ALERT_RULE_TYPES, } from "../app-alerts.js";
import { APP_ITEM_ERROR_CODES, APP_ITEM_KINDS, APP_ITEM_OWNERSHIPS, APP_ITEM_SITE_KEY_HEADER, APP_ITEM_USER_TOKEN_HEADER, APP_LINK_ROLES, AppItemsClient, } from "../app-items.js";
import { APP_MODEL_ERROR_CODES, } from "../app-models.js";
import { HOSTED_APP_CAPABILITIES, HOSTED_APP_DISCOVERY_PATH, } from "../hosted-app.js";
import { advanceFakeMeeting, endFakeMeeting, FakeCustdProblem, fakeEstimateList, fakeForecastRun, fakeForecastStory, fakeMeeting, fakeModelResults, fakeSensitivity, fromEnd, startFakeMeeting, } from "./fake-results.js";
export const FAKE_CUSTD_ORIGIN = "https://app.custd.test";
export const FAKE_CUSTD_SITE_KEY = "site_pk_fake";
export const FAKE_CUSTD_API_PATH = "/__custd";
export const FAKE_CUSTD_AUTH_PATH = "/__auth";
const DEFAULT_IDLE_SECONDS = 7 * 86400;
const MAX_ALERT_RULES = 10;
const MAX_ALERT_WEBHOOKS = 5;
const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/services/";
const json = (status, body, headers = {}) => ({
    status,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
});
const noContent = () => ({ status: 204, headers: {} });
function lowercaseHeaders(headers) {
    return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));
}
function parseJson(body) {
    if (!body)
        return undefined;
    try {
        return JSON.parse(body);
    }
    catch {
        return undefined;
    }
}
/** Sign-in storage held in memory, for tests that have no `sessionStorage`. */
export function memorySignInStorage() {
    const items = new Map();
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
export async function signInWithFake(fake, signIn, user) {
    const start = await signIn.startSignIn();
    const completion = await signIn.completeSignIn(fake.authorize(start.authorizationUrl, user));
    return completion.session;
}
export class FakeCustd {
    constructor(options = {}) {
        /** Every request the fake answered, oldest first. */
        this.requests = [];
        /** Every event the hosted app tracked, oldest first. Page views appear as `page-view`. */
        this.trackedEvents = [];
        /** Every error the hosted app captured, oldest first. */
        this.capturedErrors = [];
        this.items = new Map();
        this.links = new Map();
        this.codes = new Map();
        this.sequence = 0;
        this.userCount = 0;
        /** The fake as a `fetch`, for the SDK's clients. */
        this.fetch = async (input, init) => {
            const request = new Request(input, init);
            const headers = {};
            request.headers.forEach((value, name) => {
                headers[name] = value;
            });
            const text = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
            const answer = this.handle({ method: request.method, url: request.url, headers, body: text === "" ? null : text });
            return new Response(answer.body ?? null, { status: answer.status, headers: answer.headers });
        };
        this.origin = (options.origin ?? FAKE_CUSTD_ORIGIN).replace(/\/+$/, "");
        this.apiBaseUrl = `${this.origin}${FAKE_CUSTD_API_PATH}`;
        this.siteKey = options.siteKey ?? FAKE_CUSTD_SITE_KEY;
        this.clientId = options.clientId ?? "custd-fake-app";
        this.capabilities = options.capabilities ?? Object.values(HOSTED_APP_CAPABILITIES);
        this.now = options.now ?? Date.now;
        this.verifiedEmail = options.signedInUsersHaveVerifiedEmail ?? true;
        this.routes = { ...this.itemRoutes(), ...this.resultRoutes(), ...this.alertRoutes() };
    }
    discovery() {
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
    hostedAppOptions() {
        return {
            discoveryUrl: `${this.origin}${HOSTED_APP_DISCOVERY_PATH}`,
            fetch: this.fetch,
            signInStorage: memorySignInStorage(),
            createTracker: () => this.recordingTracker(),
            startErrorCapture: () => ({ client: this.recordingErrorCapture(), uninstall: () => { } }),
        };
    }
    // The tracker and error capture record what the app hands them and touch no page globals.
    recordingTracker() {
        const record = async (eventTypeSlug, payload) => {
            this.trackedEvents.push(payload === undefined ? { eventTypeSlug } : { eventTypeSlug, payload });
        };
        return {
            track: record,
            trackPageView: () => record("page-view"),
            installSpaTracking: () => { },
            setConsent: () => { },
            flush: async () => { },
            close: () => { },
        };
    }
    recordingErrorCapture() {
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
    appItemsClient(options = {}) {
        return AppItemsClient.fromDiscovery(this.discovery(), { fetch: this.fetch, userToken: () => options.userToken });
    }
    /** Approves a sign-in as `user` (a new user when absent) and returns the redirect back to the app. */
    authorize(authorizationUrl, user) {
        const url = new URL(authorizationUrl);
        const code = this.token();
        this.userCount += 1;
        this.codes.set(code, user ?? `user-${this.userCount}`);
        const back = new URL(url.searchParams.get("redirect_uri") ?? `${this.origin}/auth/callback`);
        back.searchParams.set("code", code);
        back.searchParams.set("state", url.searchParams.get("state") ?? "");
        return back.toString();
    }
    /** Answers one request, as a browser route interceptor hands it over. */
    handle(raw) {
        const url = new URL(raw.url);
        const request = {
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
        }
        catch (error) {
            if (!(error instanceof FakeCustdProblem))
                throw error;
            return json(error.status, { status: error.status, code: error.code, title: error.code });
        }
    }
    dispatch(request, url) {
        if (url.pathname === HOSTED_APP_DISCOVERY_PATH)
            return json(200, this.discovery());
        if (url.pathname.startsWith(FAKE_CUSTD_AUTH_PATH))
            return this.auth(request, url);
        if (!url.pathname.startsWith(FAKE_CUSTD_API_PATH))
            return json(404, { code: "not_found" });
        if (request.method === "OPTIONS")
            return noContent();
        if (request.headers[APP_ITEM_SITE_KEY_HEADER.toLowerCase()] !== this.siteKey) {
            throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.keyRefused);
        }
        const user = request.headers[APP_ITEM_USER_TOKEN_HEADER.toLowerCase()] ?? null;
        const context = { request, url, path: request.path, user };
        const route = this.routes[`${request.method} ${request.path}`];
        return route ? route(context) : this.routeWithId(context);
    }
    // ---- Sign-in ----
    auth(request, url) {
        if (url.pathname.endsWith("/authorize"))
            return { status: 302, headers: { location: this.authorize(url.toString()) } };
        const form = new URLSearchParams(request.body ?? "");
        const code = form.get("code") ?? "";
        const user = this.codes.get(code) ?? form.get("refresh_token")?.replace(/^refresh-/, "");
        this.codes.delete(code);
        if (!user)
            return json(400, { error: "invalid_grant" });
        return json(200, {
            access_token: user,
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: `refresh-${user}`,
            scope: "openid profile offline_access",
        });
    }
    // ---- Routes ----
    itemRoutes() {
        const base = "/api/v1/app/item";
        return {
            "POST /api/v1/app/items": (c) => json(201, this.create(c.request.json, c.user)),
            "GET /api/v1/app/items": (c) => json(200, { items: this.mine(c.user) }),
            [`GET ${base}`]: (c) => this.itemRead(c),
            [`PATCH ${base}`]: (c) => this.change(c, (item) => this.settings(item, c.request.json)),
            [`POST ${base}/claim`]: (c) => json(200, this.claim(this.caller(c))),
            [`POST ${base}/measurements`]: (c) => this.measure(c, c.request.json.rows),
            [`POST ${base}/measurements/csv`]: (c) => this.measure(c, csvRows(c.request.json.csv)),
            [`POST ${base}/estimates`]: (c) => json(201, this.estimate(c, c.request.json)),
            [`POST ${base}/complete`]: (c) => this.change(c, (item) => this.complete(item, c.request.json.completedAt)),
            [`POST ${base}/cancel`]: (c) => this.change(c, (item) => this.setStatus(item, "canceled")),
            [`POST ${base}/reopen`]: (c) => this.change(c, (item) => this.setStatus(item, "active")),
            [`POST ${base}/entries`]: (c) => json(201, this.addEntry(c, c.request.json)),
            [`POST ${base}/meeting/start`]: (c) => this.change(c, (item) => startFakeMeeting(this.meetingOf(item), this.now())),
            [`POST ${base}/meeting/advance`]: (c) => this.advance(c, c.request.json),
            [`POST ${base}/meeting/end`]: (c) => this.change(c, (item) => endFakeMeeting(this.meetingOf(item), this.now())),
        };
    }
    resultRoutes() {
        return {
            "POST /api/v1/app/forecast/runs": (c) => json(201, this.runForecast(c, c.request.json)),
            "GET /api/v1/app/forecast/latest": (c) => this.latestForecast(c),
            "GET /api/v1/app/forecast/story": (c) => this.story(c),
            "POST /api/v1/app/item/model/versions": (c) => {
                const body = c.request.json;
                return this.change(c, (item) => this.saveVersion(item, body.quantities, body.note ?? ""), 201);
            },
            "POST /api/v1/app/item/model/copy": (c) => json(201, this.copyModel(c, c.request.json)),
            "POST /api/v1/app/models/runs": (c) => json(201, this.runModel(c, c.request.json)),
            "POST /api/v1/app/models/calculate": (c) => json(200, this.calculate(this.caller(c), c.request.json)),
            "GET /api/v1/app/models/latest": (c) => this.latestModelRun(c),
        };
    }
    alertRoutes() {
        const base = "/api/v1/app/item/alerts";
        return {
            [`GET ${base}`]: (c) => json(200, this.alertSettings(this.caller(c))),
            [`GET ${base}/deliveries`]: (c) => json(200, { deliveries: [...this.owned(this.caller(c)).alerts.deliveries].reverse() }),
            [`POST ${base}/rules`]: (c) => json(201, this.addRule(this.owned(this.caller(c)), c.request.json)),
            [`POST ${base}/webhooks`]: (c) => json(201, this.addWebhook(this.owned(this.caller(c)), c.request.json)),
            [`POST ${base}/slack`]: (c) => json(201, this.addSlack(this.owned(this.caller(c)), c.request.json)),
            [`PUT ${base}/subscription`]: (c) => json(200, this.subscribe(this.caller(c))),
            [`DELETE ${base}/subscription`]: (c) => {
                this.owned(this.caller(c)).alerts.subscriptions.delete(c.user ?? "");
                return noContent();
            },
        };
    }
    routeWithId(context) {
        const run = /^\/api\/v1\/app\/forecast\/runs\/([^/]+)$/.exec(context.path);
        if (run && context.request.method === "GET")
            return this.forecastRun(context, run[1] ?? "");
        const match = /^\/api\/v1\/app\/item\/(entries|links|alerts\/rules|alerts\/webhooks)\/([^/]+)(\/rotate)?$/.exec(context.path);
        if (!match)
            throw new FakeCustdProblem(404, "not_found");
        const [, collection, id = "", rotate] = match;
        const item = this.owned(this.caller(context));
        if (collection === "links" && rotate && context.request.method === "POST")
            return json(200, this.rotate(item, id));
        if (context.request.method !== "DELETE" || rotate)
            throw new FakeCustdProblem(405, "method_not_allowed");
        this.remove(item, collection ?? "", id);
        return noContent();
    }
    remove(item, collection, id) {
        if (collection === "links")
            this.revoke(item, id);
        if (collection === "entries")
            item.entries = item.entries.filter((entry) => entry.entryUuid !== id);
        if (collection === "alerts/rules")
            item.alerts.rules = item.alerts.rules.filter((rule) => rule.ruleUuid !== id);
        if (collection === "alerts/webhooks") {
            item.alerts.webhooks = item.alerts.webhooks.filter((hook) => hook.webhookUuid !== id);
        }
        this.touch(item);
    }
    conditional(context, etag, body) {
        if (context.request.headers["if-none-match"] === etag)
            return { status: 304, headers: { etag } };
        return json(200, body(), { etag });
    }
    // ---- Callers ----
    caller(context) {
        const bearer = context.request.headers.authorization?.replace(/^Bearer /, "");
        const itemParam = context.url.searchParams.get("item");
        if (bearer)
            return this.linkCaller(bearer, itemParam, context.user);
        if (!context.user)
            throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
        const item = itemParam ? this.items.get(itemParam) : undefined;
        if (item && item.ownerUser === context.user)
            return { item, role: APP_LINK_ROLES.owner, user: context.user };
        const viaOwnedCollection = [...this.items.values()].some((candidate) => candidate.ownerUser === context.user && candidate.entries.some((entry) => entry.itemUuid === itemParam));
        if (item && viaOwnedCollection)
            return { item, role: APP_LINK_ROLES.share, user: context.user };
        throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
    }
    linkCaller(token, itemParam, user) {
        const link = this.links.get(token);
        const item = link ? this.items.get(link.itemUuid) : undefined;
        if (!link || !item)
            throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.linkRefused);
        if (!itemParam || itemParam === item.uuid)
            return { item, role: link.role, user };
        const entry = item.entries.find((candidate) => candidate.itemUuid === itemParam);
        const target = entry ? this.items.get(entry.itemUuid) : undefined;
        if (!target)
            throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
        return { item: target, role: APP_LINK_ROLES.share, user };
    }
    owned(caller) {
        if (caller.role !== APP_LINK_ROLES.owner)
            throw new FakeCustdProblem(403, APP_ITEM_ERROR_CODES.readOnlyLink);
        return caller.item;
    }
    touch(item) {
        item.version += 1;
        item.changeSequence = this.nextSequence();
        item.updatedAt = new Date(this.now()).toISOString();
    }
    change(context, apply, status = 200) {
        const caller = this.caller(context);
        apply(this.owned(caller));
        this.touch(caller.item);
        return json(status, this.read(caller));
    }
    // ---- Ids ----
    nextSequence() {
        this.sequence += 1;
        return this.sequence;
    }
    uuid() {
        return `00000000-0000-4000-8000-${this.nextSequence().toString(16).padStart(12, "0")}`;
    }
    /** 43 base64url characters, the shape of a real link token. */
    token() {
        return `fake${this.nextSequence()}`.padStart(43, "A");
    }
    nowIso() {
        return new Date(this.now()).toISOString();
    }
    // ---- Items ----
    create(request, user) {
        const item = this.newItem(request.kind, request.idleExpirySeconds, user);
        if (request.kind === APP_ITEM_KINDS.uncertaintyModel) {
            const create = request.uncertaintyModel;
            item.model = this.newModel(create.name, create.description ?? "");
            if (create.quantities)
                this.saveVersion(item, create.quantities, create.note ?? "");
        }
        if (request.kind === APP_ITEM_KINDS.measurementProject)
            item.project = this.newProject(item, request);
        if (request.kind === APP_ITEM_KINDS.meeting)
            item.meeting = fakeMeeting(request.meeting, () => this.uuid());
        return this.issueLinks(item);
    }
    newItem(kind, idleExpirySeconds, user) {
        const item = {
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
    issueLinks(item) {
        const ownerToken = this.issue(item.uuid, APP_LINK_ROLES.owner);
        const shareToken = this.issue(item.uuid, APP_LINK_ROLES.share);
        return { item: this.read({ item, role: APP_LINK_ROLES.owner, user: item.ownerUser }), ownerToken, shareToken };
    }
    newModel(name, description) {
        const now = this.nowIso();
        return { modelUuid: this.uuid(), name, description, latestVersion: 0, createdAt: now, updatedAt: now };
    }
    newProject(item, request) {
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
    issue(itemUuid, role) {
        const token = this.token();
        this.links.set(token, { token, itemUuid, role, linkUuid: this.uuid(), createdAt: this.nowIso() });
        return token;
    }
    rotate(item, linkUuid) {
        const old = this.linkOf(item, linkUuid);
        this.links.delete(old.token);
        const token = this.issue(item.uuid, old.role);
        const { linkUuid: newUuid, role, createdAt } = this.links.get(token) ?? old;
        this.touch(item);
        return { link: { linkUuid: newUuid, role, createdAt }, token };
    }
    revoke(item, linkUuid) {
        this.links.delete(this.linkOf(item, linkUuid).token);
    }
    linkOf(item, linkUuid) {
        const link = [...this.links.values()].find((c) => c.itemUuid === item.uuid && c.linkUuid === linkUuid);
        if (!link)
            throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
        return link;
    }
    itemRead(context) {
        const caller = this.caller(context);
        return this.conditional(context, `"${caller.item.version}"`, () => this.read(caller));
    }
    read(caller) {
        const { item } = caller;
        const read = {
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
        if (caller.role === APP_LINK_ROLES.owner)
            read.links = this.linksOf(item);
        if (item.project) {
            read.measurementProject = structuredClone(item.project);
            read.estimates = fakeEstimateList(item.estimates, item.project.delivery.targetDate, this.now());
        }
        if (item.kind === APP_ITEM_KINDS.linkCollection)
            read.linkCollection = { entries: [...item.entries] };
        if (item.model)
            read.uncertaintyModel = structuredClone(item.model);
        if (item.meeting)
            read.meeting = structuredClone(item.meeting);
        return read;
    }
    ownership(item, user) {
        if (item.ownerUser === null)
            return APP_ITEM_OWNERSHIPS.unowned;
        return item.ownerUser === user ? APP_ITEM_OWNERSHIPS.yours : APP_ITEM_OWNERSHIPS.other;
    }
    linksOf(item) {
        return [...this.links.values()]
            .filter((link) => link.itemUuid === item.uuid)
            .map(({ linkUuid, role, createdAt }) => ({ linkUuid, role, createdAt }));
    }
    mine(user) {
        if (!user)
            throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
        return [...this.items.values()]
            .filter((item) => item.ownerUser === user)
            .sort((a, b) => b.changeSequence - a.changeSequence)
            .map((item) => ({
            ...this.read({ item, role: APP_LINK_ROLES.owner, user }).item,
            name: item.project?.name ?? item.meeting?.name ?? item.model?.name ?? "",
            status: item.project?.status ?? item.meeting?.status ?? "",
        }));
    }
    claim(caller) {
        const item = this.owned(caller);
        if (!caller.user)
            throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
        if (item.ownerUser !== null && item.ownerUser !== caller.user) {
            throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.claimed);
        }
        item.ownerUser = caller.user;
        this.touch(item);
        return this.read(caller);
    }
    projectOf(item) {
        if (!item.project)
            throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
        return item.project;
    }
    meetingOf(item) {
        if (!item.meeting)
            throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
        return item.meeting;
    }
    settings(item, request) {
        if (request.idleExpirySeconds !== undefined)
            item.idleExpirySeconds = request.idleExpirySeconds;
        const change = request.project;
        if (!change)
            return;
        const project = this.projectOf(item);
        if (change.name !== undefined)
            project.name = change.name;
        if (change.description !== undefined)
            project.description = change.description;
        if (change.status !== undefined)
            project.status = change.status;
        if (change.definitionOfDone !== undefined)
            project.delivery.definitionOfDone = change.definitionOfDone;
        if (change.deliveryTargetDate !== undefined)
            project.delivery.targetDate = change.deliveryTargetDate;
        if (change.forecastMethod !== undefined)
            project.run.forecastMethod = change.forecastMethod;
        if (change.runSimilar !== undefined)
            project.run.similar = change.runSimilar;
    }
    complete(item, completedAt) {
        const project = this.projectOf(item);
        project.status = "completed";
        project.delivery.completedAt = completedAt;
        if (project.target)
            project.target.state = "completed";
    }
    setStatus(item, status) {
        const project = this.projectOf(item);
        project.status = status;
        if (status === "active" && project.target)
            project.target.state = "active";
    }
    measure(context, rows) {
        const item = this.owned(this.caller(context));
        const project = this.projectOf(item);
        item.observations.push(...rows.map((row) => ({ observedAt: row.observedAt, value: row.value })));
        const response = {
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
    estimate(context, request) {
        const item = this.owned(this.caller(context));
        this.projectOf(item);
        const estimate = {
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
    addEntry(context, request) {
        const item = this.owned(this.caller(context));
        if (item.kind !== APP_ITEM_KINDS.linkCollection)
            throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
        const link = this.links.get(request.token);
        const target = link ? this.items.get(link.itemUuid) : undefined;
        if (!target)
            throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.notFound);
        if (target.kind === APP_ITEM_KINDS.linkCollection) {
            throw new FakeCustdProblem(422, APP_ITEM_ERROR_CODES.notCollectable);
        }
        const entry = {
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
    advance(context, request) {
        const caller = this.caller(context);
        const item = this.owned(caller);
        if (advanceFakeMeeting(this.meetingOf(item), request.blockUuid, this.now()))
            this.touch(item);
        return json(200, this.read(caller));
    }
    // ---- Forecasts ----
    runForecast(context, request) {
        const item = this.owned(this.caller(context));
        const meta = { runUuid: this.uuid(), now: this.now() };
        const run = fakeForecastRun(this.projectOf(item), item.observations, request ?? {}, meta);
        item.runs.push(run);
        this.evaluateAlerts(item);
        return run;
    }
    latestForecast(context) {
        const { item } = this.caller(context);
        const run = fromEnd(item.runs, 1);
        if (!run)
            throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.forecastMissing);
        return this.conditional(context, `"run-${item.runs.length}"`, () => run);
    }
    forecastRun(context, runUuid) {
        const run = this.caller(context).item.runs.find((candidate) => candidate.forecastRunUuid === runUuid);
        if (!run)
            throw new FakeCustdProblem(404, APP_ITEM_ERROR_CODES.forecastMissing);
        return this.conditional(context, `"${run.forecastRunUuid}"`, () => run);
    }
    story(context) {
        const { item } = this.caller(context);
        const project = this.projectOf(item);
        return this.conditional(context, `"${item.version}"`, () => fakeForecastStory(project, item.observations, this.now()));
    }
    // ---- Models ----
    saveVersion(item, quantities, note) {
        const model = item.model;
        if (!model)
            throw new FakeCustdProblem(409, APP_ITEM_ERROR_CODES.wrongKind);
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
    modelVersion(item) {
        const model = item.model;
        if (!model?.version)
            throw new FakeCustdProblem(409, APP_MODEL_ERROR_CODES.runInvalid);
        return { model, quantities: model.version.quantities };
    }
    copyModel(context, request) {
        const source = this.owned(this.caller(context));
        const { model, quantities } = this.modelVersion(source);
        const copy = this.newItem(APP_ITEM_KINDS.uncertaintyModel, source.idleExpirySeconds, context.user);
        copy.model = this.newModel(request.name ?? `Copy of ${model.name}`, model.description);
        this.saveVersion(copy, quantities, "");
        return this.issueLinks(copy);
    }
    runModel(context, request) {
        const item = this.owned(this.caller(context));
        const { model, quantities } = this.modelVersion(item);
        const output = request.sensitivityOutput ?? request.decision?.output;
        const run = {
            runUuid: this.uuid(),
            modelUuid: model.modelUuid,
            versionNumber: model.latestVersion,
            trigger: "request",
            seed: request.seed,
            sampleCount: request.sampleCount ?? 10000,
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
    calculate(caller, request) {
        const { model, quantities } = this.modelVersion(caller.item);
        const overrides = new Map((request.inputs ?? []).map((input) => [input.name, input.input]));
        const changed = quantities.map((quantity) => {
            const input = overrides.get(quantity.name);
            return input && quantity.kind === "input" ? { ...quantity, input } : quantity;
        });
        const outputs = new Set(request.outputs);
        return {
            modelUuid: model.modelUuid,
            versionNumber: model.latestVersion,
            seed: request.seed ?? 1,
            sampleCount: request.sampleCount ?? 10000,
            quantities: fakeModelResults(changed).filter((result) => outputs.has(result.name)),
        };
    }
    latestModelRun(context) {
        const { item } = this.caller(context);
        const run = fromEnd(item.modelRuns, 1);
        if (!run)
            throw new FakeCustdProblem(404, APP_MODEL_ERROR_CODES.runMissing);
        return this.conditional(context, `"model-run-${item.modelRuns.length}"`, () => run);
    }
    // ---- Alerts ----
    alertSettings(caller) {
        const { alerts } = this.owned(caller);
        const subscription = caller.user ? alerts.subscriptions.get(caller.user) : undefined;
        return {
            rules: [...alerts.rules],
            webhooks: [...alerts.webhooks],
            ...(subscription ? { subscription } : {}),
            deliveryAvailable: true,
        };
    }
    addRule(item, spec) {
        if (item.alerts.rules.length >= MAX_ALERT_RULES)
            throw new FakeCustdProblem(409, APP_ALERT_ERROR_CODES.limit);
        if (!Object.values(APP_ALERT_RULE_TYPES).includes(spec.type)) {
            throw new FakeCustdProblem(400, APP_ALERT_ERROR_CODES.ruleInvalid);
        }
        const rule = {
            ...spec,
            ruleUuid: this.uuid(),
            conditionMet: false,
            crossings: 0,
            createdAt: this.nowIso(),
        };
        item.alerts.rules.push(rule);
        return rule;
    }
    addWebhook(item, request) {
        if (item.alerts.webhooks.length >= MAX_ALERT_WEBHOOKS)
            throw new FakeCustdProblem(409, APP_ALERT_ERROR_CODES.limit);
        if (!request.endpoint.startsWith("https://"))
            throw new FakeCustdProblem(400, APP_ITEM_ERROR_CODES.invalid);
        const webhook = {
            webhookUuid: this.uuid(),
            kind: APP_ALERT_DESTINATION_KINDS.webhook,
            endpoint: request.endpoint,
            createdAt: this.nowIso(),
        };
        item.alerts.webhooks.push(webhook);
        return { webhook, signingSecret: `whsec_${this.token()}` };
    }
    // A Slack destination shares the webhook bound and removal; like Custd, only a hint of its URL is kept.
    addSlack(item, request) {
        if (item.alerts.webhooks.length >= MAX_ALERT_WEBHOOKS)
            throw new FakeCustdProblem(409, APP_ALERT_ERROR_CODES.limit);
        if (!request.webhookUrl.startsWith(SLACK_WEBHOOK_PREFIX))
            throw new FakeCustdProblem(400, APP_ITEM_ERROR_CODES.invalid);
        const hint = `${request.webhookUrl.slice("https://".length).split("/").slice(0, 3).join("/")}/…`;
        const slack = {
            webhookUuid: this.uuid(),
            kind: APP_ALERT_DESTINATION_KINDS.slack,
            endpoint: hint,
            createdAt: this.nowIso(),
        };
        item.alerts.webhooks.push(slack);
        return slack;
    }
    subscribe(caller) {
        const item = this.owned(caller);
        if (!caller.user)
            throw new FakeCustdProblem(401, APP_ITEM_ERROR_CODES.signInRequired);
        if (!this.verifiedEmail)
            throw new FakeCustdProblem(422, APP_ALERT_ERROR_CODES.noVerifiedEmail);
        const existing = item.alerts.subscriptions.get(caller.user);
        if (existing)
            return existing;
        const subscription = { subscriptionUuid: this.uuid(), createdAt: this.nowIso() };
        item.alerts.subscriptions.set(caller.user, subscription);
        return subscription;
    }
    conditionMet(item, rule) {
        const target = item.project?.target;
        const counter = fromEnd(item.runs, 1)?.counter;
        if (rule.type === APP_ALERT_RULE_TYPES.targetReached)
            return target?.state === "completed";
        if (rule.type === APP_ALERT_RULE_TYPES.deadlineProbabilityBelow) {
            return counter?.deadlineProbability !== undefined && counter.deadlineProbability < (rule.threshold ?? 0);
        }
        if (rule.type === APP_ALERT_RULE_TYPES.forecastMovedInsideTarget) {
            const upper = counter?.completionInterval?.upper;
            return upper !== undefined && !!target?.targetDate && Date.parse(upper) <= Date.parse(target.targetDate);
        }
        const latest = fromEnd(item.estimates, 1);
        return latest !== undefined && this.now() - Date.parse(latest.estimatedAt) > (rule.staleDays ?? 0) * 86400000;
    }
    evaluateAlerts(item) {
        for (const rule of item.alerts.rules) {
            const met = this.conditionMet(item, rule);
            if (met && !rule.conditionMet) {
                rule.crossings += 1;
                this.deliver(item, rule);
            }
            rule.conditionMet = met;
        }
    }
    deliver(item, rule) {
        const now = this.nowIso();
        const delivery = (channel, webhookUuid) => ({
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
        for (const _ of item.alerts.subscriptions.values())
            item.alerts.deliveries.push(delivery(APP_ALERT_CHANNELS.email));
    }
}
/** `observedAt,value` lines; a first line that is not a measurement is read as the header. */
function csvRows(csv) {
    return csv
        .split(/\r?\n/)
        .map((line) => line.split(","))
        .filter(([observedAt, value]) => observedAt && value !== undefined && !Number.isNaN(Number(value)))
        .map(([observedAt = "", value]) => ({ observedAt: observedAt.trim(), value: Number(value) }));
}
