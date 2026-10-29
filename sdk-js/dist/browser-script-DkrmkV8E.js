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
function s(e) {
	if ("resolvedLabels" in e || "vocabularyFingerprint" in e) throw Error("custd: server-owned label fields are not accepted");
	if (e.labels === void 0) return;
	if (e.labels === null || typeof e.labels != "object" || Array.isArray(e.labels)) throw Error("custd: labels must be an object of strings");
	let t = Object.entries(e.labels);
	if (t.length > 16) throw Error("custd: labels may contain at most 16 entries");
	for (let [e, r] of t) {
		if (!n.test(e) || c(e) > 64 || e.startsWith("custd.")) throw Error(`custd: labels.${e} has an invalid key`);
		if (typeof r != "string" || r === "" || r !== r.trim() || c(r) > 128) throw Error(`custd: labels.${e} has an invalid value`);
	}
}
function c(e) {
	return new TextEncoder().encode(e).length;
}
function l(e) {
	let t = [];
	if (e.eventUuid || t.push("eventUuid"), e.eventTypeSlug || t.push("eventTypeSlug"), e.schemaVersion || t.push("schemaVersion"), e.timestamp || t.push("timestamp"), e.context || t.push("context"), e.payload || t.push("payload"), e.payload?.siteUuid || t.push("payload.siteUuid"), e.context?.device?.type || t.push("context.device.type"), t.length > 0) throw Error(`custd: missing required browser fields: ${t.join(", ")}`);
	a(e.environment ?? ""), s(e);
}
function u(e, t = {}) {
	return t.mode === "browser-cookieless" ? {
		...e,
		eventUuid: e.eventUuid || g(),
		sessionId: e.sessionId ?? "",
		anonymousId: e.anonymousId ?? ""
	} : {
		...e,
		eventUuid: e.eventUuid || g(),
		sessionId: e.sessionId || g(),
		anonymousId: e.anonymousId || g()
	};
}
var d = class extends Error {};
function f(e) {
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
async function p(e, t) {
	let n = 0;
	for (;;) {
		n++;
		try {
			return await t();
		} catch (t) {
			if (!(t instanceof d || t instanceof TypeError) || n >= e.maxAttempts) throw t;
			await h(m(e, n));
		}
	}
}
function m(e, t) {
	let n = e.baseDelayMs * 2 ** (t - 1), r = Math.min(n, e.maxDelayMs), i = r * e.jitter * (Math.random() * 2 - 1);
	return Math.max(0, r + i);
}
function h(e) {
	return new Promise((t) => setTimeout(t, e));
}
function g() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
//#endregion
//#region src/browser-tracker.ts
var _ = "1.0.0", v = 1e3, y = "[redacted]", ee = /^[A-Za-z][A-Za-z0-9._~-]{0,63}$/u, b = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu, x = /^[A-Za-z0-9_-]{24,}$/u, te = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u, ne = /^[A-Za-z0-9._~:{}*[\]-]*$/u, re = 1024, S = 200, C = /* @__PURE__ */ new Set([
	408,
	429,
	500,
	502,
	503,
	504
]);
function w(e) {
	return new T(e);
}
var T = class {
	constructor(e) {
		this.queue = [], this.installedSpaTracking = !1, this.lastTrackedPath = null, this.originalPushState = null, this.originalReplaceState = null, this.onlineHandler = () => this.detach("flush", () => this.flush()), this.pagehideHandler = () => this.flushWithKeepalive(), this.popstateHandler = () => this.detachPathChange(() => this.trackPageView()), this.config = e, this.baseUrl = e.baseUrl.replace(/\/$/, ""), this.queueStorage = e.queueStorage ?? oe(e.siteUuid, e.persistentQueue === !0), this.retry = f(e.retry), this.maxQueueSize = e.maxQueueSize ?? 1e3, this.queue = this.queueStorage.load(), this.trimQueue(), this.consent = e.consent === "required" ? "denied" : "granted", this.trackingDisabled() && this.clearStoredState(), $(this.baseUrl, "baseUrl"), K(e), window.addEventListener("online", this.onlineHandler), window.addEventListener("pagehide", this.pagehideHandler);
	}
	async track(e, t = {}) {
		if (this.trackingDisabled()) return;
		let n = this.buildEvent(e, t);
		(this.config.batchSize ?? 0) > 1 ? (this.enqueue(n), this.queue.length >= (this.config.batchSize ?? 0) && await this.flush()) : await this.sendEvent(n);
	}
	trackPageView() {
		return this.lastTrackedPath = window.location.pathname, this.track("page-view", F());
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
		if (this.queue.length === 0 || !ue()) return;
		let e = this.queue.splice(0, this.queue.length), t;
		try {
			t = await this.sendBatch(e);
		} catch (t) {
			throw this.queue.unshift(...e), this.trimQueue(), this.queueStorage.save(this.queue), t;
		}
		if (this.applyBatchOutcome("flush", t), t.retryable.length > 0) throw new V(t.retryableStatus ?? 503);
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
		return !!(this.consent !== "granted" || le());
	}
	enqueue(e) {
		this.queue.push(e), this.trimQueue(), this.queueStorage.save(this.queue);
	}
	trimQueue() {
		this.queue.length > this.maxQueueSize && (this.queue = this.queue.slice(this.queue.length - this.maxQueueSize));
	}
	clearStoredState() {
		this.queue = [], this.queueStorage.clear(), typeof localStorage < "u" && (localStorage.removeItem(E(this.config.siteUuid)), localStorage.removeItem(O(this.config.siteUuid))), typeof sessionStorage < "u" && sessionStorage.removeItem(D(this.config.siteUuid));
	}
	buildEvent(e, t) {
		let n = this.identityFields(), r = u({
			eventTypeSlug: e,
			schemaVersion: _,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			...n,
			context: j(this.pageContext()),
			payload: {
				siteUuid: this.config.siteUuid,
				...t
			}
		}, { mode: this.config.identityMode === "extended" ? "producer" : "browser-cookieless" });
		return l(r), o(r, this.config.environment), r;
	}
	identityFields() {
		return this.config.identityMode === "extended" ? {
			anonymousId: Z(E(this.config.siteUuid), localStorage),
			sessionId: Z(D(this.config.siteUuid), sessionStorage)
		} : {
			anonymousId: "",
			sessionId: ""
		};
	}
	async sendEvent(e) {
		await p(this.retry, async () => {
			z(await fetch(`${this.baseUrl}/api/v1/collect/events`, {
				method: "POST",
				headers: R(this.config.writeKey),
				body: JSON.stringify(e),
				credentials: "omit"
			}));
		});
	}
	async sendBatch(e, t = !1) {
		return G(e, await p(this.retry, async () => {
			let n = await fetch(`${this.baseUrl}/api/v1/collect/events/batch`, {
				method: "POST",
				headers: R(this.config.writeKey),
				body: JSON.stringify({ events: e }),
				credentials: "omit",
				keepalive: t
			});
			return z(n), W(n, e.length);
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
			path: I(window.location.pathname),
			title: document.title
		}, t = this.config.pageContext;
		if (!t) return e;
		let n;
		try {
			n = t(e);
		} catch {
			return {};
		}
		return M(n, e.path);
	}
	detach(e, t) {
		t().catch((t) => this.notifyFailure({
			source: e,
			status: U(t)
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
				status: U(t)
			});
		});
	}
};
function E(e) {
	return `custd:${e}:anonymous_id`;
}
function D(e) {
	return `custd:${e}:session_id`;
}
function O(e) {
	return `custd:${e}:event_queue`;
}
async function k(e) {
	let t = e ?? se(), n = q();
	try {
		let e = t.dataset.siteUuid, r = t.dataset.writeKey;
		if (!e || !r) throw Error("custd: browser script requires data-site-uuid and data-write-key");
		let i = t.dataset.baseUrl ?? new URL(t.src).origin;
		$(i, "baseUrl");
		let a = await A(i, e), o = w({
			baseUrl: i,
			siteUuid: e,
			writeKey: r,
			identityMode: a.identityMode,
			allowedOrigins: a.allowedOrigins,
			batchSize: Number(t.dataset.batchSize || ce(a)),
			consent: Q(t, a),
			persistentQueue: t.dataset.persistentQueue === "true"
		});
		return window.custd = {
			track: (e, t) => o.track(e, t),
			trackPageView: () => o.trackPageView(),
			setConsent: (e) => o.setConsent(e)
		}, await X(o, n), o;
	} catch (e) {
		throw ie(n, e), ae(e), e;
	}
}
async function A(e, t) {
	let n = await fetch(`${e.replace(/\/$/, "")}/api/v1/sites/${encodeURIComponent(t)}/config`, { credentials: "omit" });
	if (!n.ok) throw Error(`custd: site config request failed with status ${n.status}`);
	return await n.json();
}
function j(e) {
	let t = {
		device: { type: de() },
		locale: navigator.language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
	return (e.path !== void 0 || e.title !== void 0) && (t.page = e), t;
}
function M(e, t) {
	let n = {};
	typeof e?.path == "string" && (n.path = N(e.path) ? e.path : t);
	let r = P(e?.title);
	return r !== void 0 && (n.title = r), n;
}
function N(e) {
	return e.length === 0 || e.length > re || !e.startsWith("/") || e.startsWith("//") ? !1 : e.split("/").every((e) => ne.test(e));
}
function P(e) {
	if (typeof e != "string") return;
	let t = e.replace(/[\p{Cc}]/gu, "").trim();
	return t === "" ? void 0 : t.slice(0, S);
}
function F() {
	let e = new URL(window.location.href).searchParams, t = e.get("ref") ?? "";
	return e.get("source") !== "powered-by" || !te.test(t) ? {} : {
		utmSource: t,
		utmMedium: "powered-by"
	};
}
function I(e) {
	return (e.startsWith("/") ? e : `/${e}`).split("/").map(L).join("/") || "/";
}
function L(e) {
	if (e === "") return "";
	let t;
	try {
		t = decodeURIComponent(e);
	} catch {
		return y;
	}
	return !ee.test(t) || b.test(t) || /^\d+$/u.test(t) || x.test(t) ? y : t;
}
function R(e) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${e}`
	};
}
function z(e) {
	if (!e.ok) throw C.has(e.status) ? new V(e.status) : new B(e.status);
}
var B = class extends Error {
	constructor(e) {
		super(`custd: collector request failed with status ${e}`), this.status = e;
	}
}, V = class extends d {
	constructor(e) {
		super(`custd: retryable collector status ${e}`), this.status = e;
	}
}, H = class extends d {
	constructor() {
		super("custd: collector response did not match the batch contract");
	}
};
function U(e) {
	if (e instanceof V || e instanceof B) return e.status;
}
async function W(e, t) {
	let n;
	try {
		n = await e.json();
	} catch {
		throw new H();
	}
	let r = typeof n == "object" && n ? n.results : void 0;
	if (!Array.isArray(r) || r.length !== t) throw new H();
	return r.map((e) => {
		let t = typeof e == "object" && e ? e : {};
		if (typeof t.success != "boolean" || typeof t.status != "number") throw new H();
		return {
			success: t.success,
			status: t.status
		};
	});
}
function G(e, t) {
	let n = {
		rejected: [],
		retryable: []
	};
	return t.forEach((t, r) => {
		t.success || (C.has(t.status) ? (n.retryable.push(e[r]), n.retryableStatus ??= t.status) : n.rejected.push(e[r]));
	}), n;
}
function K(e) {
	let t = e.allowedOrigins ?? [];
	if (t.length === 0) throw Error("custd: site config must include allowed origins for this site");
	if (!t.includes(window.location.origin)) throw Error("custd: origin is not allowed for this site");
}
function q() {
	let e = {
		calls: [],
		promises: []
	};
	return window.custd = {
		track: (t, n) => J(e, {
			type: "track",
			eventTypeSlug: t,
			payload: n
		}),
		trackPageView: () => J(e, { type: "trackPageView" }),
		setConsent: (t) => {
			Y(e, {
				type: "setConsent",
				state: t
			});
		}
	}, e;
}
function J(e, t) {
	return e.calls.length >= v ? Promise.reject(/* @__PURE__ */ Error("custd: queued global call limit exceeded")) : new Promise((n, r) => {
		e.calls.push(t), e.promises.push({
			resolve: n,
			reject: r
		});
	});
}
function Y(e, t) {
	e.calls.length >= v || e.calls.push(t);
}
async function X(e, t) {
	for (let n of t.calls) {
		let r = n.type === "setConsent" ? void 0 : t.promises.shift();
		try {
			n.type === "track" ? await e.track(n.eventTypeSlug, n.payload) : n.type === "trackPageView" ? await e.trackPageView() : e.setConsent(n.state), r?.resolve();
		} catch (e) {
			r?.reject(e);
		}
	}
}
function ie(e, t) {
	for (let n of e.promises.splice(0, e.promises.length)) n.reject(t);
}
function ae(e) {
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
	let r = pe();
	return t.setItem(e, r), r;
}
function oe(n, r) {
	return !r || typeof localStorage > "u" ? new e() : new t(`custd:${n}:event_queue`);
}
function se() {
	let e = document.currentScript;
	if (!e) throw Error("custd: browser script could not find document.currentScript");
	return e;
}
function Q(e, t) {
	return e.dataset.consent === "granted" ? "granted" : t.identityMode === "extended" ? "required" : void 0;
}
function ce(e) {
	return e.identityMode === "extended" ? 25 : 1;
}
function le() {
	let e = navigator.doNotTrack;
	return e === "1" || e === "yes";
}
function ue() {
	return typeof navigator.onLine != "boolean" || navigator.onLine;
}
function de() {
	return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
function $(e, t) {
	let n = new URL(e);
	if (n.protocol !== "https:" && !(n.protocol === "http:" && fe(n.hostname))) throw Error(`custd: ${t} must use https unless it targets localhost`);
}
function fe(e) {
	return e === "localhost" || e === "127.0.0.1" || e === "::1" || e === "host.docker.internal";
}
function pe() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
k(Array.from(document.scripts).find((e) => e.src === import.meta.url)).then((e) => e.installSpaTracking()).catch(() => void 0);
//#endregion
