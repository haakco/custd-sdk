import type { EventEnvelope } from "./index.js";

const mobilePlatforms = ["android", "ios"] as const;
const mobileNetworkStates = ["offline", "online", "unknown"] as const;
const sensitiveMobilePayloadKeys = new Set([
  "secret",
  "clientsecret",
  "producersecret",
  "reportingsecret",
  "token",
  "authtoken",
  "idtoken",
  "oauthtoken",
  "refreshtoken",
  "reportingtoken",
  "accesstoken",
  "bearertoken",
  "apikey",
  "authorization",
  "password",
  "credential",
  "privatekey",
]);

export type MobilePlatform = (typeof mobilePlatforms)[number];
export type MobileNetworkState = (typeof mobileNetworkStates)[number];

export type MobileSubject = { kind: "anonymous"; anonymousId: string } | { kind: "authenticated"; userUuid: string };

export type MobileEventContext = {
  appVersion: string;
  platform: MobilePlatform;
  locale: string;
  timezone: string;
  networkState: MobileNetworkState;
};

export type MobileEventInput = {
  eventUuid?: string;
  eventTypeSlug: string;
  schemaVersion: string;
  timestamp: string;
  sessionId?: string;
  companySlug?: string;
  subject: MobileSubject;
  context: MobileEventContext;
  payload: Record<string, unknown>;
};

// createMobileEvent deliberately accepts only event metadata safe for an app
// binary. Producer credentials and reporting-read credentials belong on the
// authenticated application relay, never in a mobile event envelope.
export function createMobileEvent(input: MobileEventInput): EventEnvelope {
  assertExactKeys(
    input,
    [
      "eventUuid",
      "eventTypeSlug",
      "schemaVersion",
      "timestamp",
      "sessionId",
      "companySlug",
      "subject",
      "context",
      "payload",
    ],
    "mobile event",
  );
  assertRequiredEventFields(input);
  assertMobileSubject(input.subject);
  assertMobileContext(input.context);
  assertNoSensitiveFields(input.payload);

  return {
    eventUuid: input.eventUuid,
    eventTypeSlug: input.eventTypeSlug,
    schemaVersion: input.schemaVersion,
    timestamp: input.timestamp,
    sessionId: input.sessionId,
    anonymousId: input.subject.kind === "anonymous" ? input.subject.anonymousId : undefined,
    userUuid: input.subject.kind === "authenticated" ? input.subject.userUuid : null,
    companySlug: input.companySlug,
    context: {
      device: { type: "mobile", os: input.context.platform },
      appVersion: input.context.appVersion,
      locale: input.context.locale,
      timezone: input.context.timezone,
      networkState: input.context.networkState,
    },
    payload: input.payload,
  };
}

function assertRequiredEventFields(input: MobileEventInput): void {
  for (const [field, value] of Object.entries({
    eventTypeSlug: input.eventTypeSlug,
    schemaVersion: input.schemaVersion,
    timestamp: input.timestamp,
  })) {
    if (!isNonBlankString(value)) {
      throw new Error(`custd: mobile ${field} is required`);
    }
  }
  if (Number.isNaN(Date.parse(input.timestamp))) {
    throw new Error("custd: mobile timestamp must be an ISO timestamp");
  }
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    throw new Error("custd: mobile payload must be an object");
  }
}

function assertMobileSubject(subject: MobileSubject): void {
  if (!subject || typeof subject !== "object") {
    throw new Error("custd: mobile subject is required");
  }
  if (subject.kind === "anonymous") {
    assertExactKeys(subject, ["kind", "anonymousId"], "anonymous mobile subject");
    if (!isNonBlankString(subject.anonymousId)) {
      throw new Error("custd: mobile anonymousId is required");
    }
    return;
  }
  if (subject.kind === "authenticated") {
    assertExactKeys(subject, ["kind", "userUuid"], "authenticated mobile subject");
    if (!isNonBlankString(subject.userUuid)) {
      throw new Error("custd: mobile userUuid is required");
    }
    return;
  }
  throw new Error("custd: mobile subject kind must be anonymous or authenticated");
}

function assertMobileContext(context: MobileEventContext): void {
  assertExactKeys(context, ["appVersion", "platform", "locale", "timezone", "networkState"], "mobile context");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(context.appVersion)) {
    throw new Error("custd: mobile appVersion must be a semantic version");
  }
  if (!mobilePlatforms.includes(context.platform)) {
    throw new Error("custd: mobile platform must be ios or android");
  }
  if (!isLocale(context.locale)) {
    throw new Error("custd: mobile locale must be a valid BCP 47 locale");
  }
  if (!isTimezone(context.timezone)) {
    throw new Error("custd: mobile timezone must be a valid IANA timezone");
  }
  if (!mobileNetworkStates.includes(context.networkState)) {
    throw new Error("custd: mobile networkState must be offline, online, or unknown");
  }
}

function assertExactKeys(value: object, allowed: readonly string[], label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(`custd: unknown ${label} field: ${key}`);
    }
  }
}

function assertNoSensitiveFields(value: unknown): void {
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      throw new Error(`custd: mobile event contains sensitive field: ${key}`);
    }
    assertNoSensitiveFields(child);
  }
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return sensitiveMobilePayloadKeys.has(normalized);
}

function isLocale(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}

function isTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
