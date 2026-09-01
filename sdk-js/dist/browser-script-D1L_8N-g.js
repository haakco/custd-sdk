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
		typeof localStorage > "u" || localStorage.setItem(this.key, JSON.stringify(e));
	}
	clear() {
		typeof localStorage > "u" || localStorage.removeItem(this.key);
	}
}, n = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
function r(e) {
	if ("resolvedLabels" in e || "vocabularyFingerprint" in e) throw Error("custd: server-owned label fields are not accepted");
	if (e.labels === void 0) return;
	if (e.labels === null || typeof e.labels != "object" || Array.isArray(e.labels)) throw Error("custd: labels must be an object of strings");
	let t = Object.entries(e.labels);
	if (t.length > 16) throw Error("custd: labels may contain at most 16 entries");
	for (let [e, r] of t) {
		if (!n.test(e) || i(e) > 64 || e.startsWith("custd.")) throw Error(`custd: labels.${e} has an invalid key`);
		if (typeof r != "string" || r === "" || r !== r.trim() || i(r) > 128) throw Error(`custd: labels.${e} has an invalid value`);
	}
}
function i(e) {
	return new TextEncoder().encode(e).length;
}
function a(e) {
	let t = [];
	if (e.eventUuid || t.push("eventUuid"), e.eventTypeSlug || t.push("eventTypeSlug"), e.schemaVersion || t.push("schemaVersion"), e.timestamp || t.push("timestamp"), e.context || t.push("context"), e.payload || t.push("payload"), e.payload?.siteUuid || t.push("payload.siteUuid"), e.context?.device?.type || t.push("context.device.type"), t.length > 0) throw Error(`custd: missing required browser fields: ${t.join(", ")}`);
	r(e);
}
function o(e, t = {}) {
	return t.mode === "browser-cookieless" ? {
		...e,
		eventUuid: e.eventUuid || f(),
		sessionId: e.sessionId ?? "",
		anonymousId: e.anonymousId ?? ""
	} : {
		...e,
		eventUuid: e.eventUuid || f(),
		sessionId: e.sessionId || f(),
		anonymousId: e.anonymousId || f()
	};
}
var s = class extends Error {};
function c(e) {
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
async function l(e, t) {
	let n = 0;
	for (;;) {
		n++;
		try {
			return await t();
		} catch (t) {
			if (!(t instanceof s || t instanceof TypeError) || n >= e.maxAttempts) throw t;
			await d(u(e, n));
		}
	}
}
function u(e, t) {
	let n = e.baseDelayMs * 2 ** (t - 1), r = Math.min(n, e.maxDelayMs), i = r * e.jitter * (Math.random() * 2 - 1);
	return Math.max(0, r + i);
}
function d(e) {
	return new Promise((t) => setTimeout(t, e));
}
function f() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
//#endregion
//#region src/browser-tracker.ts
var p = "1.0.0", m = 1e3;
function h(e) {
	return new g(e);
}
var g = class {
	constructor(e) {
		this.queue = [], this.installedSpaTracking = !1, this.originalPushState = null, this.originalReplaceState = null, this.onlineHandler = () => void this.flush(), this.pagehideHandler = () => this.flushWithKeepalive(), this.popstateHandler = () => void this.trackPageView(), this.config = e, this.baseUrl = e.baseUrl.replace(/\/$/, ""), this.queueStorage = e.queueStorage ?? N(e.siteUuid, e.persistentQueue === !0), this.retry = c(e.retry), this.maxQueueSize = e.maxQueueSize ?? 1e3, this.queue = this.queueStorage.load(), this.trimQueue(), this.consent = e.consent === "required" ? "denied" : "granted", this.trackingDisabled() && this.clearStoredState(), B(this.baseUrl, "baseUrl"), T(e), window.addEventListener("online", this.onlineHandler), window.addEventListener("pagehide", this.pagehideHandler);
	}
	async track(e, t = {}) {
		if (this.trackingDisabled()) return;
		let n = this.buildEvent(e, t);
		if ((this.config.batchSize ?? 0) > 1) {
			this.enqueue(n), this.queue.length >= (this.config.batchSize ?? 0) && await this.flush();
			return;
		}
		await this.sendEvent(n);
	}
	trackPageView() {
		return this.track("page-view", {});
	}
	installSpaTracking() {
		this.installedSpaTracking || (this.installedSpaTracking = !0, this.originalPushState = window.history.pushState, this.originalReplaceState = window.history.replaceState, window.history.pushState = this.wrapHistoryMethod(this.originalPushState), window.history.replaceState = this.wrapHistoryMethod(this.originalReplaceState), window.addEventListener("popstate", this.popstateHandler), this.config.trackInitialPageView !== !1 && this.trackPageView());
	}
	setConsent(e) {
		this.consent = e, e === "denied" && this.clearStoredState();
	}
	async flush() {
		if (this.trackingDisabled()) {
			this.clearStoredState();
			return;
		}
		if (this.queue.length === 0 || !R()) return;
		let e = this.queue.splice(0, this.queue.length);
		try {
			await this.sendBatch(e);
		} catch (t) {
			throw this.queue.unshift(...e), this.trimQueue(), this.queueStorage.save(this.queue), t;
		}
		this.queueStorage.save(this.queue);
	}
	close() {
		window.removeEventListener("online", this.onlineHandler), window.removeEventListener("pagehide", this.pagehideHandler), window.removeEventListener("popstate", this.popstateHandler), this.originalPushState && (window.history.pushState = this.originalPushState), this.originalReplaceState && (window.history.replaceState = this.originalReplaceState), this.installedSpaTracking = !1, this.originalPushState = null, this.originalReplaceState = null;
	}
	wrapHistoryMethod(e) {
		return ((...t) => {
			let n = e.apply(window.history, t);
			return this.trackPageView(), n;
		});
	}
	trackingDisabled() {
		return !!(this.consent !== "granted" || L());
	}
	enqueue(e) {
		this.queue.push(e), this.trimQueue(), this.queueStorage.save(this.queue);
	}
	trimQueue() {
		this.queue.length > this.maxQueueSize && (this.queue = this.queue.slice(this.queue.length - this.maxQueueSize));
	}
	clearStoredState() {
		this.queue = [], this.queueStorage.clear(), typeof localStorage < "u" && (localStorage.removeItem(_(this.config.siteUuid)), localStorage.removeItem(y(this.config.siteUuid))), typeof sessionStorage < "u" && sessionStorage.removeItem(v(this.config.siteUuid));
	}
	buildEvent(e, t) {
		let n = this.identityFields(), r = o({
			eventTypeSlug: e,
			schemaVersion: p,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			...n,
			context: S(),
			payload: {
				siteUuid: this.config.siteUuid,
				...t
			}
		}, { mode: this.config.identityMode === "extended" ? "producer" : "browser-cookieless" });
		return a(r), r;
	}
	identityFields() {
		return this.config.identityMode === "extended" ? {
			anonymousId: M(_(this.config.siteUuid), localStorage),
			sessionId: M(v(this.config.siteUuid), sessionStorage)
		} : {
			anonymousId: "",
			sessionId: ""
		};
	}
	async sendEvent(e) {
		await l(this.retry, async () => {
			w(await fetch(`${this.baseUrl}/api/v1/collect/events`, {
				method: "POST",
				headers: C(this.config.writeKey),
				body: JSON.stringify(e),
				credentials: "omit"
			}));
		});
	}
	async sendBatch(e, t = !1) {
		await l(this.retry, async () => {
			w(await fetch(`${this.baseUrl}/api/v1/collect/events/batch`, {
				method: "POST",
				headers: C(this.config.writeKey),
				body: JSON.stringify({ events: e }),
				credentials: "omit",
				keepalive: t
			}));
		});
	}
	flushWithKeepalive() {
		if (this.trackingDisabled()) {
			this.clearStoredState();
			return;
		}
		if (this.queue.length === 0) return;
		let e = this.queue.splice(0, this.queue.length);
		this.sendBatch(e, !0).then(() => {
			this.queueStorage.save(this.queue);
		}, () => {
			this.queue.unshift(...e), this.trimQueue(), this.queueStorage.save(this.queue);
		});
	}
};
function _(e) {
	return `custd:${e}:anonymous_id`;
}
function v(e) {
	return `custd:${e}:session_id`;
}
function y(e) {
	return `custd:${e}:event_queue`;
}
async function b(e) {
	let t = e ?? P(), n = E();
	try {
		let e = t.dataset.siteUuid, r = t.dataset.writeKey;
		if (!e || !r) throw Error("custd: browser script requires data-site-uuid and data-write-key");
		let i = t.dataset.baseUrl ?? new URL(t.src).origin;
		B(i, "baseUrl");
		let a = await x(i, e), o = h({
			baseUrl: i,
			siteUuid: e,
			writeKey: r,
			identityMode: a.identityMode,
			allowedOrigins: a.allowedOrigins,
			batchSize: Number(t.dataset.batchSize || I(a)),
			consent: F(t, a),
			persistentQueue: t.dataset.persistentQueue === "true"
		});
		return window.custd = {
			track: (e, t) => o.track(e, t),
			trackPageView: () => o.trackPageView(),
			setConsent: (e) => o.setConsent(e)
		}, await k(o, n), o;
	} catch (e) {
		throw A(n, e), j(e), e;
	}
}
async function x(e, t) {
	let n = await fetch(`${e.replace(/\/$/, "")}/api/v1/sites/${encodeURIComponent(t)}/config`, { credentials: "omit" });
	if (!n.ok) throw Error(`custd: site config request failed with status ${n.status}`);
	return await n.json();
}
function S() {
	return {
		page: {
			url: window.location.href,
			path: window.location.pathname,
			title: document.title,
			referrer: document.referrer
		},
		device: { type: z() },
		locale: navigator.language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
}
function C(e) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${e}`
	};
}
function w(e) {
	if (!e.ok) throw [
		408,
		429,
		500,
		502,
		503,
		504
	].includes(e.status) ? new s(`custd: retryable collector status ${e.status}`) : Error(`custd: collector request failed with status ${e.status}`);
}
function T(e) {
	let t = e.allowedOrigins ?? [];
	if (t.length === 0) throw Error("custd: site config must include allowed origins for this site");
	if (!t.includes(window.location.origin)) throw Error("custd: origin is not allowed for this site");
}
function E() {
	let e = {
		calls: [],
		promises: []
	};
	return window.custd = {
		track: (t, n) => D(e, {
			type: "track",
			eventTypeSlug: t,
			payload: n
		}),
		trackPageView: () => D(e, { type: "trackPageView" }),
		setConsent: (t) => {
			O(e, {
				type: "setConsent",
				state: t
			});
		}
	}, e;
}
function D(e, t) {
	return e.calls.length >= m ? Promise.reject(/* @__PURE__ */ Error("custd: queued global call limit exceeded")) : new Promise((n, r) => {
		e.calls.push(t), e.promises.push({
			resolve: n,
			reject: r
		});
	});
}
function O(e, t) {
	e.calls.length >= m || e.calls.push(t);
}
async function k(e, t) {
	for (let n of t.calls) {
		let r = n.type === "setConsent" ? void 0 : t.promises.shift();
		try {
			n.type === "track" ? await e.track(n.eventTypeSlug, n.payload) : n.type === "trackPageView" ? await e.trackPageView() : e.setConsent(n.state), r?.resolve();
		} catch (e) {
			r?.reject(e);
		}
	}
}
function A(e, t) {
	for (let n of e.promises.splice(0, e.promises.length)) n.reject(t);
}
function j(e) {
	window.custd = {
		track: () => Promise.reject(e),
		trackPageView: () => Promise.reject(e),
		setConsent: () => {
			throw e;
		}
	};
}
function M(e, t) {
	let n = t.getItem(e);
	if (n) return n;
	let r = H();
	return t.setItem(e, r), r;
}
function N(n, r) {
	return !r || typeof localStorage > "u" ? new e() : new t(`custd:${n}:event_queue`);
}
function P() {
	let e = document.currentScript;
	if (!e) throw Error("custd: browser script could not find document.currentScript");
	return e;
}
function F(e, t) {
	return e.dataset.consent === "granted" ? "granted" : t.identityMode === "extended" ? "required" : void 0;
}
function I(e) {
	return e.identityMode === "extended" ? 25 : 1;
}
function L() {
	let e = navigator.doNotTrack;
	return e === "1" || e === "yes";
}
function R() {
	return typeof navigator.onLine != "boolean" || navigator.onLine;
}
function z() {
	return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
function B(e, t) {
	let n = new URL(e);
	if (n.protocol !== "https:" && !(n.protocol === "http:" && V(n.hostname))) throw Error(`custd: ${t} must use https unless it targets localhost`);
}
function V(e) {
	return e === "localhost" || e === "127.0.0.1" || e === "::1" || e === "host.docker.internal";
}
function H() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (Number(e) ^ Math.random() * 16 >> Number(e) / 4).toString(16));
}
//#endregion
//#region src/browser-script.ts
b(Array.from(document.scripts).find((e) => e.src === import.meta.url)).then((e) => e.installSpaTracking()).catch(() => void 0);
//#endregion
