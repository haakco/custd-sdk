function e() {
	let e = t(), s = typeof document < "u" && document.visibilityState === "hidden", c = {
		lcp: void 0,
		fcp: void 0
	}, l = {
		value: 0,
		session: 0,
		first: 0,
		last: 0
	}, u = /* @__PURE__ */ new Map(), d = [], f = (t, n, r = {}) => {
		if (!e.includes(t)) return;
		let i = new PerformanceObserver((e) => n(e.getEntries()));
		i.observe({
			type: t,
			buffered: !0,
			...r
		}), d.push(i);
	};
	return f("largest-contentful-paint", (e) => {
		let t = e[e.length - 1];
		t && (c.lcp = t.startTime);
	}), f("paint", (e) => {
		let t = e.find((e) => e.name === "first-contentful-paint");
		t && (c.fcp = t.startTime);
	}), f("layout-shift", (e) => n(l, e)), f("event", (e) => r(u, e), { durationThreshold: 40 }), f("first-input", (e) => r(u, e)), {
		snapshot: () => {
			let t = {};
			return o(t, "lcp", s ? void 0 : c.lcp), o(t, "fcp", s ? void 0 : c.fcp), o(t, "inp", i(u)), o(t, "ttfb", a()), e.includes("layout-shift") && Number.isFinite(l.value) && l.value >= 0 && (t.cls = Math.round(l.value * 1e4) / 1e4), t;
		},
		stop: () => {
			for (let e of d.splice(0, d.length)) e.disconnect();
		}
	};
}
function t() {
	return typeof PerformanceObserver > "u" ? [] : PerformanceObserver.supportedEntryTypes ?? [];
}
function n(e, t) {
	for (let n of t) n.hadRecentInput || (e.session > 0 && n.startTime - e.last < 1e3 && n.startTime - e.first < 5e3 ? e.session += n.value : (e.session = n.value, e.first = n.startTime), e.last = n.startTime, e.value = Math.max(e.value, e.session));
}
function r(e, t) {
	for (let n of t) {
		let t = n.interactionId ?? 0;
		t === 0 || !e.has(t) && e.size >= 1e3 || e.set(t, Math.max(e.get(t) ?? 0, n.duration));
	}
}
function i(e) {
	if (e.size === 0) return;
	let t = [...e.values()].sort((e, t) => t - e);
	return t[Math.min(Math.floor(e.size / 50), t.length - 1)];
}
function a() {
	if (typeof performance > "u" || typeof performance.getEntriesByType != "function") return;
	let e = performance.getEntriesByType("navigation")[0];
	if (e) return e.responseStart - Math.max(e.activationStart ?? 0, 0);
}
function o(e, t, n) {
	n !== void 0 && Number.isFinite(n) && n >= 0 && (e[t] = Math.round(n));
}
// src/index.ts
var s = class {
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
}, c = class {
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
}, l = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/, u = "custd.environment", d = /^[a-z][a-z0-9-]{0,31}$/;
function f(e) {
	if (e !== "") {
		if (e !== e.trim() || !d.test(e)) throw Error(`custd: environment ${JSON.stringify(e)} must be lowercase letters, digits and hyphens, at most 32 characters`);
		if (e === "unclassified") throw Error("custd: environment \"unclassified\" is reserved");
	}
}
function ee(e, t) {
	let n = e.environment || t || "";
	n !== "" && (e.labels = { ...e.labels ?? {} }, e.labels["custd.environment"] === void 0 && (e.labels[u] = n));
}
function te(e) {
	if ("resolvedLabels" in e || "vocabularyFingerprint" in e) throw Error("custd: server-owned label fields are not accepted");
	if (e.labels === void 0) return;
	if (e.labels === null || typeof e.labels != "object" || Array.isArray(e.labels)) throw Error("custd: labels must be an object of strings");
	let t = Object.entries(e.labels);
	if (t.length > 16) throw Error("custd: labels may contain at most 16 entries");
	for (let [e, n] of t) {
		if (!l.test(e) || p(e) > 64 || e.startsWith("custd.")) throw Error(`custd: labels.${e} has an invalid key`);
		if (typeof n != "string" || n === "" || n !== n.trim() || p(n) > 128) throw Error(`custd: labels.${e} has an invalid value`);
	}
}
function p(e) {
	return new TextEncoder().encode(e).length;
}
function m(e) {
	let t = [];
	if (e.eventUuid || t.push("eventUuid"), e.eventTypeSlug || t.push("eventTypeSlug"), e.schemaVersion || t.push("schemaVersion"), e.timestamp || t.push("timestamp"), e.context || t.push("context"), e.payload || t.push("payload"), e.payload?.siteUuid || t.push("payload.siteUuid"), e.context?.device?.type || t.push("context.device.type"), t.length > 0) throw Error(`custd: missing required browser fields: ${t.join(", ")}`);
	f(e.environment ?? ""), te(e);
}
function ne(e, t = {}) {
	return t.mode === "browser-cookieless" ? {
		...e,
		eventUuid: e.eventUuid || y(),
		sessionId: e.sessionId ?? "",
		anonymousId: e.anonymousId ?? ""
	} : {
		...e,
		eventUuid: e.eventUuid || y(),
		sessionId: e.sessionId || y(),
		anonymousId: e.anonymousId || y()
	};
}
var h = class extends Error {};
function re(e) {
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
async function g(e, t) {
	let n = 0;
	for (;;) {
		n++;
		try {
			return await t();
		} catch (t) {
			if (!(t instanceof h || t instanceof TypeError) || n >= e.maxAttempts) throw t;
			await v(_(e, n));
		}
	}
}
function _(e, t) {
	let n = e.baseDelayMs * 2 ** (t - 1), r = Math.min(n, e.maxDelayMs), i = r * e.jitter * (Math.random() * 2 - 1);
	return Math.max(0, r + i);
}
function v(e) {
	return new Promise((t) => setTimeout(t, e));
}
function y() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
// src/browser-tracker.ts
var ie = "1.0.0", b = "page-view", ae = "web-vitals", oe = "ai-assistant", se = /* @__PURE__ */ new Map([
	["chatgpt.com", "chatgpt"],
	["chat.openai.com", "chatgpt"],
	["perplexity.ai", "perplexity"],
	["claude.ai", "claude"],
	["gemini.google.com", "gemini"],
	["bard.google.com", "gemini"],
	["copilot.microsoft.com", "copilot"],
	["chat.deepseek.com", "deepseek"],
	["chat.mistral.ai", "mistral"],
	["grok.com", "grok"],
	["meta.ai", "meta-ai"],
	["you.com", "you"],
	["phind.com", "phind"]
]), x = /^[0-9]+\.[0-9]+\.[0-9]+$/u, S = 1e3, C = "[redacted]", ce = /^[A-Za-z][A-Za-z0-9._~-]{0,63}$/u, le = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu, ue = /^[A-Za-z0-9_-]{24,}$/u, de = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u, w = [
	["utm_source", "utmSource"],
	["utm_medium", "utmMedium"],
	["utm_campaign", "utmCampaign"],
	["utm_term", "utmTerm"],
	["utm_content", "utmContent"]
], T = 100, E = /^[A-Za-z0-9._~:{}*[\]-]*$/u, D = 1024, O = 200, k = /* @__PURE__ */ new Set([
	408,
	429,
	500,
	502,
	503,
	504
]);
function A(e) {
	return new j(e);
}
var j = class {
	constructor(t) {
		this.queue = [], this.installedSpaTracking = !1, this.lastTrackedPath = null, this.referrerClassified = !1, this.webVitals = null, this.originalPushState = null, this.originalReplaceState = null, this.onlineHandler = () => this.detach("flush", () => this.flush()), this.pagehideHandler = () => {
			this.enqueueWebVitals(), this.flushWithKeepalive();
		}, this.visibilityHandler = () => {
			document.visibilityState === "hidden" && this.enqueueWebVitals() && this.flushWithKeepalive();
		}, this.popstateHandler = () => this.detachPathChange(() => this.trackPageView()), this.config = t, this.baseUrl = t.baseUrl.replace(/\/$/, ""), this.schemaVersion = Y(t.schemaVersion), this.pageViewSchemaVersion = t.pageViewSchemaVersion === void 0 ? this.schemaVersion : Y(t.pageViewSchemaVersion), this.labels = { ...t.labels ?? {} }, this.queueStorage = t.queueStorage ?? Q(t.siteUuid, t.persistentQueue === !0), this.retry = re(t.retry), this.maxQueueSize = t.maxQueueSize ?? 1e3, this.queue = this.queueStorage.load(), this.trimQueue(), this.consent = t.consent === "required" ? "denied" : "granted", this.trackingDisabled() && this.clearStoredState(), $(this.baseUrl, "baseUrl"), ge(t), window.addEventListener("online", this.onlineHandler), window.addEventListener("pagehide", this.pagehideHandler), t.webVitals === !0 && (this.webVitalsPath = this.pageContext().path, this.webVitals = e(), window.addEventListener("visibilitychange", this.visibilityHandler));
	}
	async track(e, t = {}) {
		if (this.trackingDisabled()) return;
		let n = this.buildEvent(e, t);
		(this.config.batchSize ?? 0) > 1 ? (this.enqueue(n), this.queue.length >= (this.config.batchSize ?? 0) && await this.flush()) : await this.sendEvent(n);
	}
	trackPageView() {
		this.lastTrackedPath = window.location.pathname;
		let e = this.trackingDisabled() ? {} : this.landingReferral();
		return this.track("page-view", {
			...H(new URL(window.location.href).searchParams),
			...e
		});
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
		if (this.queue.length === 0 || !De()) return;
		let e = this.queue.splice(0, this.queue.length), t;
		try {
			t = await this.sendBatch(e);
		} catch (t) {
			throw this.queue.unshift(...e), this.trimQueue(), this.queueStorage.save(this.queue), t;
		}
		if (this.applyBatchOutcome("flush", t), t.retryable.length > 0) throw new K(t.retryableStatus ?? 503);
	}
	close() {
		window.removeEventListener("online", this.onlineHandler), window.removeEventListener("pagehide", this.pagehideHandler), window.removeEventListener("popstate", this.popstateHandler), window.removeEventListener("visibilitychange", this.visibilityHandler), this.webVitals?.stop(), this.webVitals = null, this.originalPushState && (window.history.pushState = this.originalPushState), this.originalReplaceState && (window.history.replaceState = this.originalReplaceState), this.installedSpaTracking = !1, this.originalPushState = null, this.originalReplaceState = null;
	}
	wrapHistoryMethod(e) {
		return ((...t) => {
			let n = window.location.pathname, r = e.apply(window.history, t);
			return window.location.pathname !== n && this.detach("page-view", () => this.trackPageView()), r;
		});
	}
	trackingDisabled() {
		return !!(this.consent !== "granted" || Ee());
	}
	enqueue(e) {
		this.queue.push(e), this.trimQueue(), this.queueStorage.save(this.queue);
	}
	trimQueue() {
		this.queue.length > this.maxQueueSize && (this.queue = this.queue.slice(this.queue.length - this.maxQueueSize));
	}
	clearStoredState() {
		this.queue = [], this.queueStorage.clear(), typeof localStorage < "u" && (localStorage.removeItem(M(this.config.siteUuid)), localStorage.removeItem(P(this.config.siteUuid))), typeof sessionStorage < "u" && sessionStorage.removeItem(N(this.config.siteUuid));
	}
	buildEvent(e, t) {
		let n = this.identityFields(), r = this.pageContext(), i = {
			eventTypeSlug: e,
			schemaVersion: e === b ? this.pageViewSchemaVersion : this.schemaVersion,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			...n,
			context: L(r),
			payload: {
				siteUuid: this.config.siteUuid,
				...e === b && r.path !== void 0 ? { path: r.path } : {},
				...t
			}
		};
		Object.keys(this.labels).length > 0 && (i.labels = { ...this.labels });
		let a = ne(i, { mode: this.config.identityMode === "extended" ? "producer" : "browser-cookieless" });
		return m(a), ee(a, this.config.environment), a;
	}
	landingReferral() {
		if (this.referrerClassified) return {};
		this.referrerClassified = !0;
		let e = V(document.referrer);
		return e ? {
			referrerClass: oe,
			aiAssistant: e
		} : {};
	}
	enqueueWebVitals() {
		let e = this.webVitals;
		if (!e || this.trackingDisabled()) return !1;
		this.webVitals = null, e.stop();
		let t = e.snapshot();
		if (Object.keys(t).length === 0) return !1;
		let n = this.webVitalsPath === void 0 ? {} : { path: this.webVitalsPath };
		try {
			this.enqueue(this.buildEvent(ae, {
				...n,
				...t
			}));
		} catch {
			return !1;
		}
		return !0;
	}
	identityFields() {
		return this.config.identityMode === "extended" ? {
			anonymousId: Z(M(this.config.siteUuid), localStorage),
			sessionId: Z(N(this.config.siteUuid), sessionStorage)
		} : {
			anonymousId: "",
			sessionId: ""
		};
	}
	async sendEvent(e) {
		await g(this.retry, async () => {
			W(await fetch(`${this.baseUrl}/api/v1/collect/events`, {
				method: "POST",
				headers: U(this.config.writeKey),
				body: JSON.stringify(e),
				credentials: "omit"
			}));
		});
	}
	async sendBatch(e, t = !1) {
		return he(e, await g(this.retry, async () => {
			let n = await fetch(`${this.baseUrl}/api/v1/collect/events/batch`, {
				method: "POST",
				headers: U(this.config.writeKey),
				body: JSON.stringify({ events: e }),
				credentials: "omit",
				keepalive: t
			});
			return W(n), me(n, e.length);
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
			path: fe(window.location.pathname),
			title: document.title
		}, t = this.config.pageContext;
		if (!t) return e;
		let n;
		try {
			n = t(e);
		} catch {
			return {};
		}
		return R(n, e.path);
	}
	detach(e, t) {
		t().catch((t) => this.notifyFailure({
			source: e,
			status: J(t)
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
				status: J(t)
			});
		});
	}
};
function M(e) {
	return `custd:${e}:anonymous_id`;
}
function N(e) {
	return `custd:${e}:session_id`;
}
function P(e) {
	return `custd:${e}:event_queue`;
}
async function F(e) {
	let t = e ?? Se(), n = _e();
	try {
		let e = t.dataset.siteUuid, r = t.dataset.writeKey;
		if (!e || !r) throw Error("custd: browser script requires data-site-uuid and data-write-key");
		let i = t.dataset.baseUrl ?? new URL(t.src).origin;
		$(i, "baseUrl");
		let a = await I(i, e), o = A({
			baseUrl: i,
			siteUuid: e,
			writeKey: r,
			identityMode: a.identityMode,
			allowedOrigins: a.allowedOrigins,
			pageViewSchemaVersion: je(a.pageViewSchemaVersion),
			batchSize: Number(t.dataset.batchSize || Te(a)),
			consent: Ce(t, a),
			persistentQueue: t.dataset.persistentQueue === "true",
			webVitals: t.dataset.webVitals === "true"
		});
		return window.custd = {
			track: (e, t) => o.track(e, t),
			trackPageView: () => o.trackPageView(),
			setConsent: (e) => o.setConsent(e)
		}, await ye(o, n), o;
	} catch (e) {
		throw be(n, e), xe(e), e;
	}
}
async function I(e, t, n = (e, t) => globalThis.fetch(e, t)) {
	let r = await n(`${e.replace(/\/$/, "")}/api/v1/sites/${encodeURIComponent(t)}/config`, { credentials: "omit" });
	if (!r.ok) throw Error(`custd: site config request failed with status ${r.status}`);
	return await r.json();
}
function L(e) {
	let t = {
		device: { type: Oe() },
		locale: navigator.language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
	return (e.path !== void 0 || e.title !== void 0) && (t.page = e), t;
}
function R(e, t) {
	let n = {};
	typeof e?.path == "string" && (n.path = z(e.path) ? e.path : t);
	let r = B(e?.title);
	return r !== void 0 && (n.title = r), n;
}
function z(e) {
	return e.length === 0 || e.length > D || !e.startsWith("/") || e.startsWith("//") ? !1 : e.split("/").every((e) => E.test(e));
}
function B(e) {
	if (typeof e != "string") return;
	let t = e.replace(/[\p{Cc}]/gu, "").trim();
	return t === "" ? void 0 : t.slice(0, O);
}
function V(e) {
	if (!e) return;
	let t;
	try {
		t = new URL(e).hostname.toLowerCase();
	} catch {
		return;
	}
	return se.get(t.replace(/^www\./u, ""));
}
function H(e) {
	let t = e.get("ref") ?? "";
	if (e.get("source") === "powered-by" && de.test(t)) return {
		utmSource: t,
		utmMedium: "powered-by"
	};
	let n = {};
	for (let [t, r] of w) {
		let i = e.get(t)?.toLowerCase().split(/\p{White_Space}+/u).filter(Boolean).join("_");
		i && [...i].length <= T && !/\p{Cc}/u.test(i) && (n[r] = i);
	}
	return n;
}
function fe(e) {
	return (e.startsWith("/") ? e : `/${e}`).split("/").map(pe).join("/") || "/";
}
function pe(e) {
	if (e === "") return "";
	let t;
	try {
		t = decodeURIComponent(e);
	} catch {
		return C;
	}
	return !ce.test(t) || le.test(t) || /^\d+$/u.test(t) || ue.test(t) ? C : t;
}
function U(e) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${e}`
	};
}
function W(e) {
	if (!e.ok) throw k.has(e.status) ? new K(e.status) : new G(e.status);
}
var G = class extends Error {
	constructor(e) {
		super(`custd: collector request failed with status ${e}`), this.status = e;
	}
}, K = class extends h {
	constructor(e) {
		super(`custd: retryable collector status ${e}`), this.status = e;
	}
}, q = class extends h {
	constructor() {
		super("custd: collector response did not match the batch contract");
	}
};
function J(e) {
	if (e instanceof K || e instanceof G) return e.status;
}
async function me(e, t) {
	let n;
	try {
		n = await e.json();
	} catch {
		throw new q();
	}
	let r = typeof n == "object" && n ? n.results : void 0;
	if (!Array.isArray(r) || r.length !== t) throw new q();
	return r.map((e) => {
		let t = typeof e == "object" && e ? e : {};
		if (typeof t.success != "boolean" || typeof t.status != "number") throw new q();
		return {
			success: t.success,
			status: t.status
		};
	});
}
function he(e, t) {
	let n = {
		rejected: [],
		retryable: []
	};
	return t.forEach((t, r) => {
		t.success || (k.has(t.status) ? (n.retryable.push(e[r]), n.retryableStatus ??= t.status) : n.rejected.push(e[r]));
	}), n;
}
function Y(e) {
	if (e === void 0) return ie;
	if (!x.test(e)) throw Error(`custd: schemaVersion ${JSON.stringify(e)} must be a dotted numeric version such as "1.0.0"`);
	return e;
}
function ge(e) {
	let t = e.allowedOrigins ?? [];
	if (t.length === 0) throw Error("custd: site config must include allowed origins for this site");
	if (!t.includes(window.location.origin)) throw Error("custd: origin is not allowed for this site");
}
function _e() {
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
			ve(e, {
				type: "setConsent",
				state: t
			});
		}
	}, e;
}
function X(e, t) {
	return e.calls.length >= S ? Promise.reject(/* @__PURE__ */ Error("custd: queued global call limit exceeded")) : new Promise((n, r) => {
		e.calls.push(t), e.promises.push({
			resolve: n,
			reject: r
		});
	});
}
function ve(e, t) {
	e.calls.length >= S || e.calls.push(t);
}
async function ye(e, t) {
	for (let n of t.calls) {
		let r = n.type === "setConsent" ? void 0 : t.promises.shift();
		try {
			n.type === "track" ? await e.track(n.eventTypeSlug, n.payload) : n.type === "trackPageView" ? await e.trackPageView() : e.setConsent(n.state), r?.resolve();
		} catch (e) {
			r?.reject(e);
		}
	}
}
function be(e, t) {
	for (let n of e.promises.splice(0, e.promises.length)) n.reject(t);
}
function xe(e) {
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
	let r = Ae();
	return t.setItem(e, r), r;
}
function Q(e, t) {
	return !t || typeof localStorage > "u" ? new s() : new c(`custd:${e}:event_queue`);
}
function Se() {
	let e = document.currentScript;
	if (!e) throw Error("custd: browser script could not find document.currentScript");
	return e;
}
function Ce(e, t) {
	return e.dataset.consent === "granted" ? "granted" : we(t);
}
function we(e) {
	return e.identityMode === "extended" ? "required" : void 0;
}
function Te(e) {
	return e.identityMode === "extended" ? 25 : 1;
}
function Ee() {
	let e = navigator.doNotTrack;
	return e === "1" || e === "yes";
}
function De() {
	return typeof navigator.onLine != "boolean" || navigator.onLine;
}
function Oe() {
	return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
function $(e, t) {
	let n = new URL(e);
	if (n.protocol !== "https:" && !(n.protocol === "http:" && ke(n.hostname))) throw Error(`custd: ${t} must use https unless it targets localhost`);
}
function ke(e) {
	return e === "localhost" || e === "127.0.0.1" || e === "::1" || e === "host.docker.internal";
}
function Ae() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
function je(e) {
	return typeof e == "string" && x.test(e) ? e : void 0;
}
F(Array.from(document.scripts).find((e) => e.src === import.meta.url)).then((e) => e.installSpaTracking()).catch(() => void 0);
