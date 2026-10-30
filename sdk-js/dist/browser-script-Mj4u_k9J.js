//#region src/index.ts
var e = class {
	constructor() {
		this.events = [];
	}
	load() {
		return [...this.events];
	}
	save(e) {
		this.events = [...e];
	}
	clear() {
		this.events = [];
	}
}, t = class {
	constructor(e = "custd_event_queue") {
		this.key = e;
	}
	load() {
		if (typeof localStorage > "u") return [];
		let e = localStorage.getItem(this.key);
		if (!e) return [];
		try {
			let t = JSON.parse(e);
			if (Array.isArray(t)) return t;
		} catch {
			return [];
		}
		return [];
	}
	save(e) {
		typeof localStorage < "u" && localStorage.setItem(this.key, JSON.stringify(e));
	}
	clear() {
		typeof localStorage < "u" && localStorage.removeItem(this.key);
	}
}, n = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/, r = "custd.environment", i = /^[a-z][a-z0-9-]{0,31}$/;
function a(e) {
	if (e !== "") {
		if (e !== e.trim() || !i.test(e)) throw Error(`custd: environment ${JSON.stringify(e)} must be lowercase letters, digits and hyphens, at most 32 characters`);
		if (e === "unclassified") throw Error("custd: environment \"unclassified\" is reserved");
	}
}
function o(e, t) {
	let n = e.environment || t || "";
	n !== "" && (e.labels = { ...e.labels ?? {} }, e.labels["custd.environment"] === void 0 && (e.labels[r] = n));
}
function ee(e) {
	if ("resolvedLabels" in e || "vocabularyFingerprint" in e) throw Error("custd: server-owned label fields are not accepted");
	if (e.labels === void 0) return;
	if (e.labels === null || typeof e.labels != "object" || Array.isArray(e.labels)) throw Error("custd: labels must be an object of strings");
	let t = Object.entries(e.labels);
	if (t.length > 16) throw Error("custd: labels may contain at most 16 entries");
	for (let [e, r] of t) {
		if (!n.test(e) || s(e) > 64 || e.startsWith("custd.")) throw Error(`custd: labels.${e} has an invalid key`);
		if (typeof r != "string" || r === "" || r !== r.trim() || s(r) > 128) throw Error(`custd: labels.${e} has an invalid value`);
	}
}
function s(e) {
	return new TextEncoder().encode(e).length;
}
function c(e) {
	let t = [];
	if (e.eventUuid || t.push("eventUuid"), e.eventTypeSlug || t.push("eventTypeSlug"), e.schemaVersion || t.push("schemaVersion"), e.timestamp || t.push("timestamp"), e.context || t.push("context"), e.payload || t.push("payload"), e.payload?.siteUuid || t.push("payload.siteUuid"), e.context?.device?.type || t.push("context.device.type"), t.length > 0) throw Error(`custd: missing required browser fields: ${t.join(", ")}`);
	a(e.environment ?? ""), ee(e);
}
function l(e, t = {}) {
	return t.mode === "browser-cookieless" ? {
		...e,
		eventUuid: e.eventUuid || h(),
		sessionId: e.sessionId ?? "",
		anonymousId: e.anonymousId ?? ""
	} : {
		...e,
		eventUuid: e.eventUuid || h(),
		sessionId: e.sessionId || h(),
		anonymousId: e.anonymousId || h()
	};
}
var u = class extends Error {};
function d(e) {
	return {
		maxAttempts: e?.maxAttempts ?? 3,
		baseDelayMs: e?.baseDelayMs ?? 200,
		maxDelayMs: e?.maxDelayMs ?? 2e3,
		jitter: e?.jitter ?? .2,
		retryOnStatuses: e?.retryOnStatuses ?? [
			408,
			429,
			500,
			502,
			503,
			504
		]
	};
}
async function f(e, t) {
	let n = 0;
	for (;;) {
		n++;
		try {
			return await t();
		} catch (t) {
			if (!(t instanceof u || t instanceof TypeError) || n >= e.maxAttempts) throw t;
			await m(p(e, n));
		}
	}
}
function p(e, t) {
	let n = e.baseDelayMs * 2 ** (t - 1), r = Math.min(n, e.maxDelayMs), i = r * e.jitter * (Math.random() * 2 - 1);
	return Math.max(0, r + i);
}
function m(e) {
	return new Promise((t) => setTimeout(t, e));
}
function h() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
//#endregion
//#region src/browser-tracker.ts
var g = "1.0.0", _ = /^[0-9]+\.[0-9]+\.[0-9]+$/u, v = 1e3, y = "[redacted]", b = /^[A-Za-z][A-Za-z0-9._~-]{0,63}$/u, x = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu, te = /^[A-Za-z0-9_-]{24,}$/u, ne = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u, re = /^[A-Za-z0-9._~:{}*[\]-]*$/u, S = 1024, C = 200, w = /* @__PURE__ */ new Set([
	408,
	429,
	500,
	502,
	503,
	504
]);
function T(e) {
	return new E(e);
}
var E = class {
	constructor(e) {
		this.queue = [], this.installedSpaTracking = !1, this.lastTrackedPath = null, this.originalPushState = null, this.originalReplaceState = null, this.onlineHandler = () => this.detach("flush", () => this.flush()), this.pagehideHandler = () => this.flushWithKeepalive(), this.popstateHandler = () => this.detachPathChange(() => this.trackPageView()), this.config = e, this.baseUrl = e.baseUrl.replace(/\/$/, ""), this.schemaVersion = q(e.schemaVersion), this.queueStorage = e.queueStorage ?? Q(e.siteUuid, e.persistentQueue === !0), this.retry = d(e.retry), this.maxQueueSize = e.maxQueueSize ?? 1e3, this.queue = this.queueStorage.load(), this.trimQueue(), this.consent = e.consent === "required" ? "denied" : "granted", this.trackingDisabled() && this.clearStoredState(), $(this.baseUrl, "baseUrl"), J(e), window.addEventListener("online", this.onlineHandler), window.addEventListener("pagehide", this.pagehideHandler);
	}
	async track(e, t = {}) {
		if (this.trackingDisabled()) return;
		let n = this.buildEvent(e, t);
		(this.config.batchSize ?? 0) > 1 ? (this.enqueue(n), this.queue.length >= (this.config.batchSize ?? 0) && await this.flush()) : await this.sendEvent(n);
	}
	trackPageView() {
		return this.lastTrackedPath = window.location.pathname, this.track("page-view", I());
	}
	installSpaTracking() {
		this.installedSpaTracking || (this.installedSpaTracking = !0, this.originalPushState = window.history.pushState, this.originalReplaceState = window.history.replaceState, window.history.pushState = this.wrapHistoryMethod(this.originalPushState), window.history.replaceState = this.wrapHistoryMethod(this.originalReplaceState), window.addEventListener("popstate", this.popstateHandler), this.config.trackInitialPageView !== !1 && this.detach("page-view", () => this.trackPageView()));
	}
	setConsent(e) {
		this.consent = e, e === "denied" && this.clearStoredState();
	}
	async flush() {
		if (this.trackingDisabled()) {
			this.clearStoredState();
			return;
		}
		if (this.queue.length === 0 || !fe()) return;
		let e = this.queue.splice(0, this.queue.length), t;
		try {
			t = await this.sendBatch(e);
		} catch (t) {
			throw this.queue.unshift(...e), this.trimQueue(), this.queueStorage.save(this.queue), t;
		}
		if (this.applyBatchOutcome("flush", t), t.retryable.length > 0) throw new H(t.retryableStatus ?? 503);
	}
	close() {
		window.removeEventListener("online", this.onlineHandler), window.removeEventListener("pagehide", this.pagehideHandler), window.removeEventListener("popstate", this.popstateHandler), this.originalPushState && (window.history.pushState = this.originalPushState), this.originalReplaceState && (window.history.replaceState = this.originalReplaceState), this.installedSpaTracking = !1, this.originalPushState = null, this.originalReplaceState = null;
	}
	wrapHistoryMethod(e) {
		return ((...t) => {
			let n = window.location.pathname, r = e.apply(window.history, t);
			return window.location.pathname !== n && this.detach("page-view", () => this.trackPageView()), r;
		});
	}
	trackingDisabled() {
		return !!(this.consent !== "granted" || de());
	}
	enqueue(e) {
		this.queue.push(e), this.trimQueue(), this.queueStorage.save(this.queue);
	}
	trimQueue() {
		this.queue.length > this.maxQueueSize && (this.queue = this.queue.slice(this.queue.length - this.maxQueueSize));
	}
	clearStoredState() {
		this.queue = [], this.queueStorage.clear(), typeof localStorage < "u" && (localStorage.removeItem(D(this.config.siteUuid)), localStorage.removeItem(k(this.config.siteUuid))), typeof sessionStorage < "u" && sessionStorage.removeItem(O(this.config.siteUuid));
	}
	buildEvent(e, t) {
		let n = this.identityFields(), r = l({
			eventTypeSlug: e,
			schemaVersion: this.schemaVersion,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			...n,
			context: M(this.pageContext()),
			payload: {
				siteUuid: this.config.siteUuid,
				...t
			}
		}, { mode: this.config.identityMode === "extended" ? "producer" : "browser-cookieless" });
		return c(r), o(r, this.config.environment), r;
	}
	identityFields() {
		return this.config.identityMode === "extended" ? {
			anonymousId: Z(D(this.config.siteUuid), localStorage),
			sessionId: Z(O(this.config.siteUuid), sessionStorage)
		} : {
			anonymousId: "",
			sessionId: ""
		};
	}
	async sendEvent(e) {
		await f(this.retry, async () => {
			B(await fetch(`${this.baseUrl}/api/v1/collect/events`, {
				method: "POST",
				headers: z(this.config.writeKey),
				body: JSON.stringify(e),
				credentials: "omit"
			}));
		});
	}
	async sendBatch(e, t = !1) {
		return K(e, await f(this.retry, async () => {
			let n = await fetch(`${this.baseUrl}/api/v1/collect/events/batch`, {
				method: "POST",
				headers: z(this.config.writeKey),
				body: JSON.stringify({ events: e }),
				credentials: "omit",
				keepalive: t
			});
			return B(n), G(n, e.length);
		}));
	}
	applyBatchOutcome(e, t) {
		t.retryable.length > 0 && (this.queue.unshift(...t.retryable), this.trimQueue()), this.queueStorage.save(this.queue), t.rejected.length > 0 && this.notifyFailure({
			source: e,
			rejectedEvents: t.rejected.length
		});
	}
	pageContext() {
		let e = {
			path: L(window.location.pathname),
			title: document.title
		}, t = this.config.pageContext;
		if (!t) return e;
		let n;
		try {
			n = t(e);
		} catch {
			return {};
		}
		return N(n, e.path);
	}
	detach(e, t) {
		t().catch((t) => this.notifyFailure({
			source: e,
			status: W(t)
		}));
	}
	detachPathChange(e) {
		window.location.pathname !== this.lastTrackedPath && this.detach("page-view", e);
	}
	notifyFailure(e) {
		let t = this.config.onFailure;
		if (t) try {
			Promise.resolve(t(e)).catch(() => void 0);
		} catch {}
	}
	flushWithKeepalive() {
		if (this.trackingDisabled()) {
			this.clearStoredState();
			return;
		}
		if (this.queue.length === 0) return;
		let e = this.queue.splice(0, this.queue.length);
		this.sendBatch(e, !0).then((e) => {
			this.applyBatchOutcome("flush", e), e.retryable.length > 0 && this.notifyFailure({
				source: "flush",
				status: e.retryableStatus ?? 503
			});
		}, (t) => {
			this.queue.unshift(...e), this.trimQueue(), this.queueStorage.save(this.queue), this.notifyFailure({
				source: "flush",
				status: W(t)
			});
		});
	}
};
function D(e) {
	return `custd:${e}:anonymous_id`;
}
function O(e) {
	return `custd:${e}:session_id`;
}
function k(e) {
	return `custd:${e}:event_queue`;
}
async function A(e) {
	let t = e ?? ce(), n = Y();
	try {
		let e = t.dataset.siteUuid, r = t.dataset.writeKey;
		if (!e || !r) throw Error("custd: browser script requires data-site-uuid and data-write-key");
		let i = t.dataset.baseUrl ?? new URL(t.src).origin;
		$(i, "baseUrl");
		let a = await j(i, e), o = T({
			baseUrl: i,
			siteUuid: e,
			writeKey: r,
			identityMode: a.identityMode,
			allowedOrigins: a.allowedOrigins,
			batchSize: Number(t.dataset.batchSize || ue(a)),
			consent: le(t, a),
			persistentQueue: t.dataset.persistentQueue === "true"
		});
		return window.custd = {
			track: (e, t) => o.track(e, t),
			trackPageView: () => o.trackPageView(),
			setConsent: (e) => o.setConsent(e)
		}, await ae(o, n), o;
	} catch (e) {
		throw oe(n, e), se(e), e;
	}
}
async function j(e, t) {
	let n = await fetch(`${e.replace(/\/$/, "")}/api/v1/sites/${encodeURIComponent(t)}/config`, { credentials: "omit" });
	if (!n.ok) throw Error(`custd: site config request failed with status ${n.status}`);
	return await n.json();
}
function M(e) {
	let t = {
		device: { type: pe() },
		locale: navigator.language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
	return (e.path !== void 0 || e.title !== void 0) && (t.page = e), t;
}
function N(e, t) {
	let n = {};
	typeof e?.path == "string" && (n.path = P(e.path) ? e.path : t);
	let r = F(e?.title);
	return r !== void 0 && (n.title = r), n;
}
function P(e) {
	return e.length === 0 || e.length > S || !e.startsWith("/") || e.startsWith("//") ? !1 : e.split("/").every((e) => re.test(e));
}
function F(e) {
	if (typeof e != "string") return;
	let t = e.replace(/[\p{Cc}]/gu, "").trim();
	return t === "" ? void 0 : t.slice(0, C);
}
function I() {
	let e = new URL(window.location.href).searchParams, t = e.get("ref") ?? "";
	return e.get("source") !== "powered-by" || !ne.test(t) ? {} : {
		utmSource: t,
		utmMedium: "powered-by"
	};
}
function L(e) {
	return (e.startsWith("/") ? e : `/${e}`).split("/").map(R).join("/") || "/";
}
function R(e) {
	if (e === "") return "";
	let t;
	try {
		t = decodeURIComponent(e);
	} catch {
		return y;
	}
	return !b.test(t) || x.test(t) || /^\d+$/u.test(t) || te.test(t) ? y : t;
}
function z(e) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${e}`
	};
}
function B(e) {
	if (!e.ok) throw w.has(e.status) ? new H(e.status) : new V(e.status);
}
var V = class extends Error {
	constructor(e) {
		super(`custd: collector request failed with status ${e}`), this.status = e;
	}
}, H = class extends u {
	constructor(e) {
		super(`custd: retryable collector status ${e}`), this.status = e;
	}
}, U = class extends u {
	constructor() {
		super("custd: collector response did not match the batch contract");
	}
};
function W(e) {
	if (e instanceof H || e instanceof V) return e.status;
}
async function G(e, t) {
	let n;
	try {
		n = await e.json();
	} catch {
		throw new U();
	}
	let r = typeof n == "object" && n ? n.results : void 0;
	if (!Array.isArray(r) || r.length !== t) throw new U();
	return r.map((e) => {
		let t = typeof e == "object" && e ? e : {};
		if (typeof t.success != "boolean" || typeof t.status != "number") throw new U();
		return {
			success: t.success,
			status: t.status
		};
	});
}
function K(e, t) {
	let n = {
		rejected: [],
		retryable: []
	};
	return t.forEach((t, r) => {
		t.success || (w.has(t.status) ? (n.retryable.push(e[r]), n.retryableStatus ??= t.status) : n.rejected.push(e[r]));
	}), n;
}
function q(e) {
	if (e === void 0) return g;
	if (!_.test(e)) throw Error(`custd: schemaVersion ${JSON.stringify(e)} must be a dotted numeric version such as "1.0.0"`);
	return e;
}
function J(e) {
	let t = e.allowedOrigins ?? [];
	if (t.length === 0) throw Error("custd: site config must include allowed origins for this site");
	if (!t.includes(window.location.origin)) throw Error("custd: origin is not allowed for this site");
}
function Y() {
	let e = {
		calls: [],
		promises: []
	};
	return window.custd = {
		track: (t, n) => X(e, {
			type: "track",
			eventTypeSlug: t,
			payload: n
		}),
		trackPageView: () => X(e, { type: "trackPageView" }),
		setConsent: (t) => {
			ie(e, {
				type: "setConsent",
				state: t
			});
		}
	}, e;
}
function X(e, t) {
	return e.calls.length >= v ? Promise.reject(/* @__PURE__ */ Error("custd: queued global call limit exceeded")) : new Promise((n, r) => {
		e.calls.push(t), e.promises.push({
			resolve: n,
			reject: r
		});
	});
}
function ie(e, t) {
	e.calls.length >= v || e.calls.push(t);
}
async function ae(e, t) {
	for (let n of t.calls) {
		let r = n.type === "setConsent" ? void 0 : t.promises.shift();
		try {
			n.type === "track" ? await e.track(n.eventTypeSlug, n.payload) : n.type === "trackPageView" ? await e.trackPageView() : e.setConsent(n.state), r?.resolve();
		} catch (e) {
			r?.reject(e);
		}
	}
}
function oe(e, t) {
	for (let n of e.promises.splice(0, e.promises.length)) n.reject(t);
}
function se(e) {
	window.custd = {
		track: () => Promise.reject(e),
		trackPageView: () => Promise.reject(e),
		setConsent: () => {
			throw e;
		}
	};
}
function Z(e, t) {
	let n = t.getItem(e);
	if (n) return n;
	let r = he();
	return t.setItem(e, r), r;
}
function Q(n, r) {
	return !r || typeof localStorage > "u" ? new e() : new t(`custd:${n}:event_queue`);
}
function ce() {
	let e = document.currentScript;
	if (!e) throw Error("custd: browser script could not find document.currentScript");
	return e;
}
function le(e, t) {
	return e.dataset.consent === "granted" ? "granted" : t.identityMode === "extended" ? "required" : void 0;
}
function ue(e) {
	return e.identityMode === "extended" ? 25 : 1;
}
function de() {
	let e = navigator.doNotTrack;
	return e === "1" || e === "yes";
}
function fe() {
	return typeof navigator.onLine != "boolean" || navigator.onLine;
}
function pe() {
	return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
function $(e, t) {
	let n = new URL(e);
	if (n.protocol !== "https:" && !(n.protocol === "http:" && me(n.hostname))) throw Error(`custd: ${t} must use https unless it targets localhost`);
}
function me(e) {
	return e === "localhost" || e === "127.0.0.1" || e === "::1" || e === "host.docker.internal";
}
function he() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
A(Array.from(document.scripts).find((e) => e.src === import.meta.url)).then((e) => e.installSpaTracking()).catch(() => void 0);
//#endregion
