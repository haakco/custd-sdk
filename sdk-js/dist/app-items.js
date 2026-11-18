// Browser data access for hosted apps: create an item with the app's Site key, then read and
// change it with its owner link, or only read it with its share link. A link token travels only
// in the Authorization header: never in a URL, a log line or an error message.
import { APP_ALERT_ERROR_CODES, } from "./app-alerts.js";
import { APP_LIVE_STATUSES, AppLiveRegistry, } from "./app-live.js";
import { APP_MEETING_ERROR_CODES, } from "./app-meetings.js";
import { APP_MODEL_ERROR_CODES, } from "./app-models.js";
export const APP_ITEM_SITE_KEY_HEADER = "X-Custd-Site-Key";
/** Carries the signed-in user's access token beside the link token. */
export const APP_ITEM_USER_TOKEN_HEADER = "X-Custd-User-Token";
export const APP_ITEM_OWNERSHIPS = {
    unowned: "unowned",
    yours: "yours",
    other: "other",
};
export const APP_ITEM_KINDS = {
    measurementProject: "measurement_project",
    linkCollection: "link_collection",
    uncertaintyModel: "uncertainty_model",
    meeting: "meeting",
};
export const APP_LINK_ROLES = {
    owner: "owner",
    share: "share",
};
export const APP_MEASUREMENT_PROJECT_KINDS = {
    deadlineForecast: "deadline_forecast",
    runwayForecast: "runway_forecast",
};
export const APP_FORECAST_METHODS = {
    bootstrapQuantile: "bootstrap_quantile",
    bayesianLinearRegression: "bayesian_linear_regression",
    seasonal7Day: "seasonal_7_day",
};
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
};
export class AppItemError extends Error {
    constructor(
    /** HTTP status; null when no answer arrived. */
    status, code, problem) {
        super(`custd: app item request failed [status=${status ?? "none"} code=${code}]`);
        this.status = status;
        this.code = code;
        this.problem = problem;
        this.name = "AppItemError";
    }
    /** The user must sign in (again): their access token was refused, or none was sent. */
    get signInNeeded() {
        return this.code === APP_ITEM_ERROR_CODES.userRefused || this.code === APP_ITEM_ERROR_CODES.signInRequired;
    }
    /** Alert email needs a verified address: the signed-in user must verify one first. */
    get verifiedEmailNeeded() {
        return this.code === APP_ALERT_ERROR_CODES.noVerifiedEmail;
    }
    /** Retrying cannot help: the link, key or request itself was refused. */
    get terminal() {
        return (this.status !== null && this.status >= 400 && this.status < 500 && this.status !== 408 && this.status !== 429);
    }
}
const ITEMS_PATH = "/api/v1/app/items";
const ITEM_PATH = "/api/v1/app/item";
const FORECAST_PATH = "/api/v1/app/forecast";
const MODELS_PATH = "/api/v1/app/models";
const ALERTS_PATH = `${ITEM_PATH}/alerts`;
const MEETING_PATH = `${ITEM_PATH}/meeting`;
export class AppItemsClient {
    constructor(config) {
        this.live = new AppLiveRegistry();
        this.baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
        this.siteKey = config.siteKey;
        this.fetchImpl = config.fetch ?? ((input, init) => globalThis.fetch(input, init));
        this.userToken = config.userToken;
    }
    /** Builds the client from a hosted app's discovery file. */
    static fromDiscovery(discovery, options = {}) {
        return new AppItemsClient({
            apiBaseUrl: discovery.apiBaseUrl,
            siteKey: discovery.browserKey,
            fetch: options.fetch,
            userToken: options.userToken,
        });
    }
    /**
     * Creates an item with the Site key; a signed-in creator owns it at once. Keep both tokens:
     * they are shown this once.
     */
    async createItem(request) {
        return this.json({ method: "POST", path: ITEMS_PATH, body: request, ...this.signedIn() });
    }
    /** "My items": the live items the signed-in user owns in this app, most recently changed first. */
    async listMyItems() {
        return this.json({ method: "GET", path: ITEMS_PATH, ...this.signedIn() });
    }
    /**
     * Makes the signed-in holder of an owner link the item's owner. A repeat by the same user
     * succeeds; an item another user owns is refused with `claimed`.
     */
    claim(ownerToken) {
        return this.write(ownerToken, "POST", `${ITEM_PATH}/claim`);
    }
    readItem(access, options = {}) {
        return this.conditional(ITEM_PATH, access, options);
    }
    updateSettings(access, request) {
        return this.write(access, "PATCH", ITEM_PATH, request);
    }
    /** Records up to 1000 measurements; check each row's `success`. */
    addMeasurements(access, request) {
        return this.write(access, "POST", `${ITEM_PATH}/measurements`, request);
    }
    /** Records measurements from a pasted CSV document. */
    importMeasurementsCsv(access, csv) {
        return this.write(access, "POST", `${ITEM_PATH}/measurements/csv`, { csv });
    }
    createEstimate(access, request) {
        return this.write(access, "POST", `${ITEM_PATH}/estimates`, request);
    }
    complete(access, request) {
        return this.write(access, "POST", `${ITEM_PATH}/complete`, request);
    }
    cancel(access) {
        return this.write(access, "POST", `${ITEM_PATH}/cancel`);
    }
    reopen(access) {
        return this.write(access, "POST", `${ITEM_PATH}/reopen`);
    }
    /** Adds the item a pasted link opens to a link collection. */
    addEntry(access, request) {
        return this.write(access, "POST", `${ITEM_PATH}/entries`, request);
    }
    async removeEntry(access, entryUuid) {
        await this.write(access, "DELETE", `${ITEM_PATH}/entries/${encodeURIComponent(entryUuid)}`);
    }
    async revokeLink(access, linkUuid) {
        await this.write(access, "DELETE", `${ITEM_PATH}/links/${encodeURIComponent(linkUuid)}`);
    }
    /** Replaces a link; the old token stops working. The new token is shown this once. */
    rotateLink(access, linkUuid) {
        return this.write(access, "POST", `${ITEM_PATH}/links/${encodeURIComponent(linkUuid)}/rotate`);
    }
    /** Runs the item's forecast. Owner link only. */
    runForecast(access, request = {}) {
        return this.write(access, "POST", `${FORECAST_PATH}/runs`, request);
    }
    /** The newest forecast run; a `forecastMissing` AppItemError until one exists. */
    latestForecast(access, options = {}) {
        return this.conditional(`${FORECAST_PATH}/latest`, access, options);
    }
    forecastRun(access, runUuid, options = {}) {
        return this.conditional(`${FORECAST_PATH}/runs/${encodeURIComponent(runUuid)}`, access, options);
    }
    forecastStory(access, options = {}) {
        return this.conditional(`${FORECAST_PATH}/story`, access, options);
    }
    /** Saves a new immutable version of the item's model: the whole quantity list. Owner link only. */
    addModelVersion(access, request) {
        return this.write(access, "POST", `${ITEM_PATH}/model/versions`, request);
    }
    /** Copies a version into a new model item with its own two links, each token shown this once. */
    copyModel(access, request = {}) {
        return this.write(access, "POST", `${ITEM_PATH}/model/copy`, request);
    }
    /** Runs the item's model and stores the run, which becomes every viewer's latest. Owner link only. */
    runModel(access, request) {
        return this.write(access, "POST", `${MODELS_PATH}/runs`, request);
    }
    /** Runs a version with some inputs set to other values and returns only `outputs`. Any link; never stored. */
    calculateModel(access, request) {
        return this.json({
            method: "POST",
            path: `${MODELS_PATH}/calculate`,
            body: request,
            ...this.reach(access),
        });
    }
    /** The newest model run; a `runMissing` AppItemError until one exists. */
    latestModelRun(access, options = {}) {
        return this.conditional(`${MODELS_PATH}/latest`, access, options);
    }
    /** The item's alert rules, webhooks and the signed-in caller's email subscription. Owner only. */
    alertSettings(access) {
        return this.json({ method: "GET", path: ALERTS_PATH, ...this.reach(access) });
    }
    /** The item's newest alert deliveries, at most 100. Owner only. */
    alertDeliveries(access) {
        return this.json({ method: "GET", path: `${ALERTS_PATH}/deliveries`, ...this.reach(access) });
    }
    /** Adds a rule that fires once each time its condition becomes true. At most 10 per item. */
    addAlertRule(access, rule) {
        return this.json({ method: "POST", path: `${ALERTS_PATH}/rules`, body: rule, ...this.reach(access) });
    }
    /** Removes a rule and its delivery history. */
    async removeAlertRule(access, ruleUuid) {
        await this.json({
            method: "DELETE",
            path: `${ALERTS_PATH}/rules/${encodeURIComponent(ruleUuid)}`,
            ...this.reach(access),
        });
    }
    /** Registers a signed webhook. Its `signingSecret` is shown this once. At most 5 per item. */
    addAlertWebhook(access, request) {
        return this.json({
            method: "POST",
            path: `${ALERTS_PATH}/webhooks`,
            body: request,
            ...this.reach(access),
        });
    }
    /** Removes a webhook; its undelivered alerts go with it. */
    async removeAlertWebhook(access, webhookUuid) {
        await this.json({
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
    subscribeAlertEmail(access) {
        return this.json({
            method: "PUT",
            path: `${ALERTS_PATH}/subscription`,
            ...this.reach(access),
        });
    }
    /** Stops the signed-in user's alert email. Repeating it succeeds. */
    async unsubscribeAlertEmail(access) {
        await this.json({ method: "DELETE", path: `${ALERTS_PATH}/subscription`, ...this.reach(access) });
    }
    /** Starts the meeting item's first block. Owner only. */
    startMeeting(access) {
        return this.meetingStep(access, "start");
    }
    /**
     * Finishes the block `blockUuid` names (the meeting's `currentBlockUuid`) and puts the next one
     * on. Repeating the advance of the block that just finished returns the meeting unchanged; any
     * other block is refused with a 409 `stepRefused`, after which watched reads poll at once.
     */
    advanceMeeting(access, request) {
        return this.meetingStep(access, "advance", request);
    }
    /** Ends the meeting now; blocks not reached are recorded as `not_run`. */
    endMeeting(access) {
        return this.meetingStep(access, "end");
    }
    /** A self-refreshing latest model run; `empty` until the first run exists. */
    watchLatestModelRun(access, options = {}) {
        return this.live.watch(this.liveKey(access, "model_latest", options.item), accessKey(access), options, (etag) => this.latestModelRun(access, { item: options.item, etag }).catch(noModelRunYet));
    }
    /** A self-refreshing item read, shared by every caller watching the same item and link. */
    watchItem(access, options = {}) {
        return this.live.watch(this.liveKey(access, "item", options.item), accessKey(access), options, (etag) => this.readItem(access, { item: options.item, etag }));
    }
    /** A self-refreshing latest forecast; `empty` until the first run exists. */
    watchLatestForecast(access, options = {}) {
        return this.live.watch(this.liveKey(access, "forecast_latest", options.item), accessKey(access), options, (etag) => this.latestForecast(access, { item: options.item, etag }).catch(noForecastYet));
    }
    /** A self-refreshing forecast story. */
    watchForecastStory(access, options = {}) {
        return this.live.watch(this.liveKey(access, "forecast_story", options.item), accessKey(access), options, (etag) => this.forecastStory(access, { item: options.item, etag }));
    }
    /** Polls every watched read now, for example after the signed-in user changed. */
    refreshAll() {
        this.live.refreshAll();
    }
    liveKey(access, resource, item) {
        return `${resource}\u0000${item ?? ""}\u0000${accessKey(access)}`;
    }
    /** The link or user-owned item a call reaches, with the signed-in user when there is one. */
    reach(access) {
        const userToken = this.userToken?.()?.trim() || undefined;
        if (typeof access === "string")
            return { credential: { linkToken: access, userToken } };
        return { credential: { userToken }, item: access.item };
    }
    signedIn() {
        return { credential: { userToken: this.userToken?.()?.trim() || undefined } };
    }
    async write(access, method, path, body) {
        const result = await this.json({ method, path, body, ...this.reach(access) });
        this.live.refreshToken(accessKey(access));
        return result;
    }
    async meetingStep(access, step, body) {
        try {
            return await this.write(access, "POST", `${MEETING_PATH}/${step}`, body);
        }
        catch (error) {
            // A refused step means this page's view is behind: show watchers the meeting as it is.
            if (error instanceof AppItemError && error.code === APP_MEETING_ERROR_CODES.stepRefused) {
                this.live.refreshToken(accessKey(access));
            }
            throw error;
        }
    }
    async conditional(path, access, options) {
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
        }));
        return { status: "modified", data, etag: response.headers.get("etag") };
    }
    async json(request) {
        const response = await this.send(request);
        if (response.status === 204)
            return null;
        return (await response.json());
    }
    async send(request) {
        const url = new URL(`${this.baseUrl}${request.path}`);
        if (request.item)
            url.searchParams.set("item", request.item);
        // Only the headers the app routes' preflight allows.
        const headers = { [APP_ITEM_SITE_KEY_HEADER]: this.siteKey };
        if (request.credential?.linkToken)
            headers.Authorization = `Bearer ${request.credential.linkToken}`;
        if (request.credential?.userToken)
            headers[APP_ITEM_USER_TOKEN_HEADER] = request.credential.userToken;
        if (request.etag)
            headers["If-None-Match"] = request.etag;
        if (request.body !== undefined)
            headers["Content-Type"] = "application/json";
        let response;
        try {
            response = await this.fetchImpl(url.toString(), {
                method: request.method,
                headers,
                body: request.body === undefined ? undefined : JSON.stringify(request.body),
                credentials: "omit",
                cache: "no-store",
            });
        }
        catch {
            throw new AppItemError(null, APP_ITEM_ERROR_CODES.network);
        }
        if (response.ok || response.status === 304)
            return response;
        throw await problemError(response);
    }
}
function accessKey(access) {
    return typeof access === "string" ? access : `item:${access.item}`;
}
async function problemError(response) {
    const body = await response.json().catch(() => null);
    const problem = isRecord(body) ? body : undefined;
    const code = typeof problem?.code === "string" && problem.code !== "" ? problem.code : `http_${response.status}`;
    return new AppItemError(response.status, code, problem);
}
/** A missing forecast is an empty answer, not a failure: polling carries on until a run lands. */
function noForecastYet(error) {
    if (error instanceof AppItemError && error.code === APP_ITEM_ERROR_CODES.forecastMissing) {
        return { status: APP_LIVE_STATUSES.empty };
    }
    throw error;
}
function noModelRunYet(error) {
    if (error instanceof AppItemError && error.code === APP_MODEL_ERROR_CODES.runMissing) {
        return { status: APP_LIVE_STATUSES.empty };
    }
    throw error;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
// ---- Links ----
/** A link token is 32 random bytes as unpadded base64url. */
const LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/**
 * The owner page: the token sits in the fragment, which browsers never send to a server, so no
 * request log or page view records it.
 */
export function appItemOwnerUrl(parts) {
    return `https://${parts.host}/edit/${encodeURIComponent(parts.kindPath)}#${parts.token}`;
}
/** The read-only share page. A share token may sit in the path because it only reads. */
export function appItemShareUrl(parts) {
    return `https://${parts.host}/${encodeURIComponent(parts.kindPath)}/${parts.token}`;
}
/** Reads a pasted owner URL, share URL or bare token. Returns null when it holds no link token. */
export function parseAppItemLink(input) {
    const value = input.trim();
    if (LINK_TOKEN_PATTERN.test(value))
        return { token: value };
    let url;
    try {
        url = new URL(value);
    }
    catch {
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
