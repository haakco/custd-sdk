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
// src/secure-url.ts
var s = [
	"localhost",
	"127.0.0.1",
	"[::1]",
	"host.docker.internal"
];
function c(e) {
	return s.includes(e);
}
// src/response-lists.generated.ts
var l = { "GET /api/v1/sites/{siteUuid}/config": ["allowedOrigins"] };
// src/response-lists.ts
function u(e) {
	let t;
	return function(n, r, i) {
		t ??= f(e);
		let [a = ""] = r.split("?", 1), o = t.find((e) => (e.method === n || e.method === "ANY") && e.pattern.test(a));
		if (i === null && o?.fields.some((e) => e.length === 1 && e[0] === "[]")) return [];
		for (let e of o?.fields ?? []) m(i, e, 0);
		return i;
	};
}
var d = /* @__PURE__ */ u(l);
function f(e) {
	return Object.entries(e).map(([e, t]) => {
		let [n = "", r = ""] = e.split(" "), i = r.split("/").map((e) => /^\{[^}]+\}$/.test(e) ? "[^/]+" : p(e));
		return {
			method: n,
			pattern: RegExp(`^${i.join("/")}$`),
			parameters: i.filter((e) => e === "[^/]+").length,
			fields: t.map((e) => e.split(".").flatMap(ee))
		};
	}).sort((e, t) => e.parameters - t.parameters);
}
function ee(e) {
	let t = e.replace(/(\[\])+$/, ""), n = (e.length - t.length) / 2;
	return [...t ? [t] : [], ...Array(n).fill("[]")];
}
function p(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function m(e, t, n) {
	let r = t[n];
	if (r === "[]") {
		if (Array.isArray(e)) for (let r of e) m(r, t, n + 1);
		return;
	}
	if (r === void 0 || typeof e != "object" || !e || Array.isArray(e)) return;
	let i = e;
	n === t.length - 1 ? i[r] === null && (i[r] = []) : m(i[r], t, n + 1);
}
// src/index.ts
var te = class {
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
}, ne = class {
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
}, re = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/, h = "custd.environment", g = /^[a-z][a-z0-9-]{0,31}$/;
function _(e) {
	if (e !== "") {
		if (e !== e.trim() || !g.test(e)) throw Error(`custd: environment ${JSON.stringify(e)} must be lowercase letters, digits and hyphens, at most 32 characters`);
		if (e === "unclassified") throw Error("custd: environment \"unclassified\" is reserved");
	}
}
function v(e, t) {
	let n = e.environment || t || "";
	n !== "" && (e.labels = { ...e.labels ?? {} }, e.labels["custd.environment"] === void 0 && (e.labels[h] = n));
}
function y(e) {
	if ("resolvedLabels" in e || "vocabularyFingerprint" in e) throw Error("custd: server-owned label fields are not accepted");
	if (e.labels === void 0) return;
	if (e.labels === null || typeof e.labels != "object" || Array.isArray(e.labels)) throw Error("custd: labels must be an object of strings");
	let t = Object.entries(e.labels);
	if (t.length > 16) throw Error("custd: labels may contain at most 16 entries");
	for (let [e, n] of t) {
		if (!re.test(e) || b(e) > 64 || e.startsWith("custd.")) throw Error(`custd: labels.${e} has an invalid key`);
		if (typeof n != "string" || n === "" || n !== n.trim() || b(n) > 128) throw Error(`custd: labels.${e} has an invalid value`);
	}
}
function b(e) {
	return new TextEncoder().encode(e).length;
}
function ie(e) {
	let t = [];
	if (e.eventUuid || t.push("eventUuid"), e.eventTypeSlug || t.push("eventTypeSlug"), e.schemaVersion || t.push("schemaVersion"), e.timestamp || t.push("timestamp"), e.context || t.push("context"), e.payload || t.push("payload"), e.payload?.siteUuid || t.push("payload.siteUuid"), e.context?.device?.type || t.push("context.device.type"), t.length > 0) throw Error(`custd: missing required browser fields: ${t.join(", ")}`);
	_(e.environment ?? ""), y(e);
}
function ae(e, t = {}) {
	return t.mode === "browser-cookieless" ? {
		...e,
		eventUuid: e.eventUuid || C(),
		sessionId: e.sessionId ?? "",
		anonymousId: e.anonymousId ?? ""
	} : {
		...e,
		eventUuid: e.eventUuid || C(),
		sessionId: e.sessionId || C(),
		anonymousId: e.anonymousId || C()
	};
}
var x = class extends Error {};
function oe(e) {
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
async function S(e, t) {
	let n = 0;
	for (;;) {
		n++;
		try {
			return await t();
		} catch (t) {
			if (!(t instanceof x || t instanceof TypeError) || n >= e.maxAttempts) throw t;
			await ce(se(e, n));
		}
	}
}
function se(e, t) {
	let n = e.baseDelayMs * 2 ** (t - 1), r = Math.min(n, e.maxDelayMs), i = r * e.jitter * (Math.random() * 2 - 1);
	return Math.max(0, r + i);
}
function ce(e) {
	return new Promise((t) => setTimeout(t, e));
}
function C() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
// src/browser-tracker.ts
var le = "1.0.0", w = "page-view", ue = "web-vitals", de = "ai-assistant", T = /* @__PURE__ */ new Map([
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
]), E = /^[0-9]+\.[0-9]+\.[0-9]+$/u, D = 1e3, O = "[redacted]", k = /^[A-Za-z][A-Za-z0-9._~-]{0,63}$/u, A = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu, j = /^[A-Za-z0-9_-]{24,}$/u, M = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u, N = [
	["utm_source", "utmSource"],
	["utm_medium", "utmMedium"],
	["utm_campaign", "utmCampaign"],
	["utm_term", "utmTerm"],
	["utm_content", "utmContent"]
], P = 100, F = /^[A-Za-z0-9._~:{}*[\]-]*$/u, I = 1024, L = 200, R = /* @__PURE__ */ new Set([
	408,
	429,
	500,
	502,
	503,
	504
]);
function z(e) {
	return new B(e);
}
var B = class {
	constructor(t) {
		this.queue = [], this.installedSpaTracking = !1, this.lastTrackedPath = null, this.referrerClassified = !1, this.webVitals = null, this.originalPushState = null, this.originalReplaceState = null, this.onlineHandler = () => this.detach("flush", () => this.flush()), this.pagehideHandler = () => {
			this.enqueueWebVitals(), this.flushWithKeepalive();
		}, this.visibilityHandler = () => {
			document.visibilityState === "hidden" && this.enqueueWebVitals() && this.flushWithKeepalive();
		}, this.popstateHandler = () => this.detachPathChange(() => this.trackPageView()), this.config = t, this.baseUrl = t.baseUrl.replace(/\/$/, ""), this.schemaVersion = Y(t.schemaVersion), this.pageViewSchemaVersion = t.pageViewSchemaVersion === void 0 ? this.schemaVersion : Y(t.pageViewSchemaVersion), this.labels = { ...t.labels ?? {} }, this.queueStorage = t.queueStorage ?? je(t.siteUuid, t.persistentQueue === !0), this.retry = oe(t.retry), this.maxQueueSize = t.maxQueueSize ?? 1e3, this.queue = this.queueStorage.load(), this.trimQueue(), this.consent = t.consent === "required" ? "denied" : "granted", this.trackingDisabled() && this.clearStoredState(), $(this.baseUrl, "baseUrl"), Te(t), window.addEventListener("online", this.onlineHandler), window.addEventListener("pagehide", this.pagehideHandler), t.webVitals === !0 && (this.webVitalsPath = this.pageContext().path, this.webVitals = e(), window.addEventListener("visibilitychange", this.visibilityHandler));
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
			...be(new URL(window.location.href).searchParams),
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
		if (this.queue.length === 0 || !Ie()) return;
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
		return !!(this.consent !== "granted" || Fe());
	}
	enqueue(e) {
		this.queue.push(e), this.trimQueue(), this.queueStorage.save(this.queue);
	}
	trimQueue() {
		this.queue.length > this.maxQueueSize && (this.queue = this.queue.slice(this.queue.length - this.maxQueueSize));
	}
	clearStoredState() {
		this.queue = [], this.queueStorage.clear(), typeof localStorage < "u" && (localStorage.removeItem(V(this.config.siteUuid)), localStorage.removeItem(fe(this.config.siteUuid))), typeof sessionStorage < "u" && sessionStorage.removeItem(H(this.config.siteUuid));
	}
	buildEvent(e, t) {
		let n = this.identityFields(), r = this.pageContext(), i = {
			eventTypeSlug: e,
			schemaVersion: e === w ? this.pageViewSchemaVersion : this.schemaVersion,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			...n,
			context: he(r),
			payload: {
				siteUuid: this.config.siteUuid,
				...e === w && r.path !== void 0 ? { path: r.path } : {},
				...t
			}
		};
		Object.keys(this.labels).length > 0 && (i.labels = { ...this.labels });
		let a = ae(i, { mode: this.config.identityMode === "extended" ? "producer" : "browser-cookieless" });
		return ie(a), v(a, this.config.environment), a;
	}
	landingReferral() {
		if (this.referrerClassified) return {};
		this.referrerClassified = !0;
		let e = ye(document.referrer);
		return e ? {
			referrerClass: de,
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
			this.enqueue(this.buildEvent(ue, {
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
			anonymousId: Z(V(this.config.siteUuid), localStorage),
			sessionId: Z(H(this.config.siteUuid), sessionStorage)
		} : {
			anonymousId: "",
			sessionId: ""
		};
	}
	async sendEvent(e) {
		await S(this.retry, async () => {
			W(await fetch(`${this.baseUrl}/api/v1/collect/events`, {
				method: "POST",
				headers: U(this.config.writeKey),
				body: JSON.stringify(e),
				credentials: "omit"
			}));
		});
	}
	async sendBatch(e, t = !1) {
		return we(e, await S(this.retry, async () => {
			let n = await fetch(`${this.baseUrl}/api/v1/collect/events/batch`, {
				method: "POST",
				headers: U(this.config.writeKey),
				body: JSON.stringify({ events: e }),
				credentials: "omit",
				keepalive: t
			});
			return W(n), Ce(n, e.length);
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
			path: xe(window.location.pathname),
			title: document.title
		}, t = this.config.pageContext;
		if (!t) return e;
		let n;
		try {
			n = t(e);
		} catch {
			return {};
		}
		return ge(n, e.path);
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
function V(e) {
	return `custd:${e}:anonymous_id`;
}
function H(e) {
	return `custd:${e}:session_id`;
}
function fe(e) {
	return `custd:${e}:event_queue`;
}
async function pe(e) {
	let t = e ?? Q(), n = Ee();
	try {
		let e = t.dataset.siteUuid, r = t.dataset.writeKey;
		if (!e || !r) throw Error("custd: browser script requires data-site-uuid and data-write-key");
		let i = t.dataset.baseUrl ?? new URL(t.src).origin;
		$(i, "baseUrl");
		let a = await me(i, e), o = z({
			baseUrl: i,
			siteUuid: e,
			writeKey: r,
			identityMode: a.identityMode,
			allowedOrigins: a.allowedOrigins,
			pageViewSchemaVersion: ze(a.pageViewSchemaVersion),
			batchSize: Number(t.dataset.batchSize || Pe(a)),
			consent: Me(t, a),
			persistentQueue: t.dataset.persistentQueue === "true",
			webVitals: t.dataset.webVitals === "true"
		});
		return window.custd = {
			track: (e, t) => o.track(e, t),
			trackPageView: () => o.trackPageView(),
			setConsent: (e) => o.setConsent(e)
		}, await Oe(o, n), o;
	} catch (e) {
		throw ke(n, e), Ae(e), e;
	}
}
async function me(e, t, n = (e, t) => globalThis.fetch(e, t)) {
	let r = `/api/v1/sites/${encodeURIComponent(t)}/config`, i = await n(`${e.replace(/\/$/, "")}${r}`, { credentials: "omit" });
	if (!i.ok) throw Error(`custd: site config request failed with status ${i.status}`);
	return d("GET", r, await i.json());
}
function he(e) {
	let t = {
		device: { type: Le() },
		locale: navigator.language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
	return (e.path !== void 0 || e.title !== void 0) && (t.page = e), t;
}
function ge(e, t) {
	let n = {};
	typeof e?.path == "string" && (n.path = _e(e.path) ? e.path : t);
	let r = ve(e?.title);
	return r !== void 0 && (n.title = r), n;
}
function _e(e) {
	return e.length === 0 || e.length > I || !e.startsWith("/") || e.startsWith("//") ? !1 : e.split("/").every((e) => F.test(e));
}
function ve(e) {
	if (typeof e != "string") return;
	let t = e.replace(/[\p{Cc}]/gu, "").trim();
	return t === "" ? void 0 : t.slice(0, L);
}
function ye(e) {
	if (!e) return;
	let t;
	try {
		t = new URL(e).hostname.toLowerCase();
	} catch {
		return;
	}
	return T.get(t.replace(/^www\./u, ""));
}
function be(e) {
	let t = e.get("ref") ?? "";
	if (e.get("source") === "powered-by" && M.test(t)) return {
		utmSource: t,
		utmMedium: "powered-by"
	};
	let n = {};
	for (let [t, r] of N) {
		let i = e.get(t)?.toLowerCase().split(/\p{White_Space}+/u).filter(Boolean).join("_");
		i && [...i].length <= P && !/\p{Cc}/u.test(i) && (n[r] = i);
	}
	return n;
}
function xe(e) {
	return (e.startsWith("/") ? e : `/${e}`).split("/").map(Se).join("/") || "/";
}
function Se(e) {
	if (e === "") return "";
	let t;
	try {
		t = decodeURIComponent(e);
	} catch {
		return O;
	}
	return !k.test(t) || A.test(t) || /^\d+$/u.test(t) || j.test(t) ? O : t;
}
function U(e) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${e}`
	};
}
function W(e) {
	if (!e.ok) throw R.has(e.status) ? new K(e.status) : new G(e.status);
}
var G = class extends Error {
	constructor(e) {
		super(`custd: collector request failed with status ${e}`), this.status = e;
	}
}, K = class extends x {
	constructor(e) {
		super(`custd: retryable collector status ${e}`), this.status = e;
	}
}, q = class extends x {
	constructor() {
		super("custd: collector response did not match the batch contract");
	}
};
function J(e) {
	if (e instanceof K || e instanceof G) return e.status;
}
async function Ce(e, t) {
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
function we(e, t) {
	let n = {
		rejected: [],
		retryable: []
	};
	return t.forEach((t, r) => {
		t.success || (R.has(t.status) ? (n.retryable.push(e[r]), n.retryableStatus ??= t.status) : n.rejected.push(e[r]));
	}), n;
}
function Y(e) {
	if (e === void 0) return le;
	if (!E.test(e)) throw Error(`custd: schemaVersion ${JSON.stringify(e)} must be a dotted numeric version such as "1.0.0"`);
	return e;
}
function Te(e) {
	let t = e.allowedOrigins ?? [];
	if (t.length === 0) throw Error("custd: site config must include allowed origins for this site");
	if (!t.includes(window.location.origin)) throw Error("custd: origin is not allowed for this site");
}
function Ee() {
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
			De(e, {
				type: "setConsent",
				state: t
			});
		}
	}, e;
}
function X(e, t) {
	return e.calls.length >= D ? Promise.reject(/* @__PURE__ */ Error("custd: queued global call limit exceeded")) : new Promise((n, r) => {
		e.calls.push(t), e.promises.push({
			resolve: n,
			reject: r
		});
	});
}
function De(e, t) {
	e.calls.length >= D || e.calls.push(t);
}
async function Oe(e, t) {
	for (let n of t.calls) {
		let r = n.type === "setConsent" ? void 0 : t.promises.shift();
		try {
			n.type === "track" ? await e.track(n.eventTypeSlug, n.payload) : n.type === "trackPageView" ? await e.trackPageView() : e.setConsent(n.state), r?.resolve();
		} catch (e) {
			r?.reject(e);
		}
	}
}
function ke(e, t) {
	for (let n of e.promises.splice(0, e.promises.length)) n.reject(t);
}
function Ae(e) {
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
	let r = Re();
	return t.setItem(e, r), r;
}
function je(e, t) {
	return !t || typeof localStorage > "u" ? new te() : new ne(`custd:${e}:event_queue`);
}
function Q() {
	let e = document.currentScript;
	if (!e) throw Error("custd: browser script could not find document.currentScript");
	return e;
}
function Me(e, t) {
	return e.dataset.consent === "granted" ? "granted" : Ne(t);
}
function Ne(e) {
	return e.identityMode === "extended" ? "required" : void 0;
}
function Pe(e) {
	return e.identityMode === "extended" ? 25 : 1;
}
function Fe() {
	let e = navigator.doNotTrack;
	return e === "1" || e === "yes";
}
function Ie() {
	return typeof navigator.onLine != "boolean" || navigator.onLine;
}
function Le() {
	return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
function $(e, t) {
	let n = new URL(e);
	if (n.protocol !== "https:" && !(n.protocol === "http:" && c(n.hostname))) throw Error(`custd: ${t} must use https unless it targets localhost`);
}
function Re() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
function ze(e) {
	return typeof e == "string" && E.test(e) ? e : void 0;
}
pe(Array.from(document.scripts).find((e) => e.src === import.meta.url)).then((e) => e.installSpaTracking()).catch(() => void 0);
