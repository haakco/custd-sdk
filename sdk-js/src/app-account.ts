import {
  optionalString,
  requireBoolean,
  requireObjectList,
  requireRecord,
  requireString,
} from "./response-validation.js";

export type AppAccountNavigationConfig = {
  /** The application's configured Custd issuer. */
  issuer: string;
  /** The same app home configured on the issuer for the settings return link. */
  applicationHome: string;
};

export type AppAccountNavigation = {
  settingsUrl: string;
  returnUrl: string;
};

/** Build the account link without accepting destinations from browser navigation state. */
export function appAccountNavigation(config: AppAccountNavigationConfig): AppAccountNavigation {
  const issuer = appHttpsUrl(config.issuer);
  if (issuer.search || issuer.hash) throw new TypeError("custd: invalid account issuer");
  const settings = new URL(`${issuer.pathname.replace(/\/$/, "")}/settings`, issuer.origin);
  if (settings.origin !== issuer.origin) throw new TypeError("custd: invalid account issuer path");
  return { settingsUrl: settings.href, returnUrl: appHttpsUrl(config.applicationHome).href };
}

function appHttpsUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new TypeError("custd: app account URLs must use HTTPS without credentials");
  }
  return url;
}

export type CreateAppAccountEntryOptions = {
  /** The trusted issuer that authenticated this application session. */
  issuer: string;
  /** The registered application's serialized HTTPS origin. */
  applicationOrigin: string;
  accessToken: string;
  fetch?: typeof globalThis.fetch;
};

export type AppAccountEntry = {
  actionUrl: string;
  /** A short-lived, one-use credential for the form body. Keep it out of URLs and logs. */
  ticket: string;
};

/** Issue a hosted settings entry ticket for the remembered application session. */
export async function createAppAccountEntry(options: CreateAppAccountEntryOptions): Promise<AppAccountEntry> {
  const issuer = appHttpsUrl(options.issuer);
  if (options.issuer !== issuer.origin && options.issuer !== `${issuer.origin}/`) {
    throw new TypeError("custd: account entry requires an HTTPS issuer origin");
  }
  const applicationOrigin = appHttpsUrl(options.applicationOrigin).origin;
  if (applicationOrigin !== options.applicationOrigin) {
    throw new TypeError("custd: account entry requires a serialized application origin");
  }
  const actionUrl = `${issuer.origin}/settings/entry`;
  const response = await requestWithAppGrant(
    options.fetch ?? globalThis.fetch.bind(globalThis),
    options.accessToken,
    new URL(`${actionUrl}/ticket`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationOrigin }),
    },
  );
  if (!response.ok) throw new AppAccountEntryError(response.status);
  const entry = requireRecord(
    await response.json().catch(() => {
      throw new TypeError("custd: invalid app account entry response");
    }),
    "app account entry",
  );
  const ticket = requireString(entry, "ticket", "app account entry");
  if (entry.actionUrl !== actionUrl || !/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(ticket)) {
    throw new TypeError("custd: invalid app account entry response");
  }
  return { actionUrl, ticket };
}

export class AppAccountEntryError extends Error {
  constructor(readonly status: number) {
    super(`custd: app account entry request failed (HTTP ${status})`);
    this.name = "AppAccountEntryError";
  }
}

export type CurrentAppProfileField = {
  fieldKey: string;
  value?: string;
  present: boolean;
  /** Remains true after an explicit clear so apps do not import the old value again. */
  initialized: boolean;
  required: boolean;
  editableBy: string;
  editable: boolean;
};

export type CurrentAppProfile = {
  fields: CurrentAppProfileField[];
  managedPhoto?: boolean;
};

export type CurrentAppProfileUpdate = {
  values: { fieldKey: string; value: string }[];
};

export type CurrentAppProfileClientConfig = {
  apiBaseUrl: string;
  /** Returns the current end-user access token with the application's profile scope. */
  accessToken: () => string | Promise<string>;
  fetch?: typeof globalThis.fetch;
};

export class CurrentAppProfileError extends Error {
  constructor(readonly status: number) {
    super(`custd: current app profile request failed (HTTP ${status})`);
    this.name = "CurrentAppProfileError";
  }
}

const profilePath = "/api/v1/app/profile";
const photoPath = `${profilePath}/photo`;
const maxPhotoBytes = 256 * 1024;
const profileContext = "current app profile";

export class CurrentAppProfileClient {
  private readonly origin: string;
  private readonly fetch: typeof globalThis.fetch;

  constructor(private readonly config: CurrentAppProfileClientConfig) {
    this.origin = appHttpsUrl(config.apiBaseUrl).origin;
    this.fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  read(): Promise<CurrentAppProfile> {
    return this.profile(profilePath, { method: "GET" });
  }

  update(update: CurrentAppProfileUpdate): Promise<CurrentAppProfile> {
    return this.writeFields("PATCH", update);
  }

  /** Fill only previously uninitialized fields and return the current profile. */
  initialize(update: CurrentAppProfileUpdate): Promise<CurrentAppProfile> {
    return this.writeFields("POST", update);
  }

  private writeFields(method: "PATCH" | "POST", update: CurrentAppProfileUpdate): Promise<CurrentAppProfile> {
    return this.profile(profilePath, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  }

  async readPhoto(): Promise<Blob> {
    const response = await this.request(photoPath, { method: "GET" });
    const photo = await response.blob();
    validatePhoto(photo);
    return photo;
  }

  uploadPhoto(photo: Blob): Promise<CurrentAppProfile> {
    return this.writePhoto("PUT", photo);
  }

  /** Fill a previously uninitialized photo and return the current profile. */
  initializePhoto(photo: Blob): Promise<CurrentAppProfile> {
    return this.writePhoto("POST", photo);
  }

  private writePhoto(method: "PUT" | "POST", photo: Blob): Promise<CurrentAppProfile> {
    validatePhoto(photo);
    return this.profile(photoPath, { method, headers: { "Content-Type": photo.type }, body: photo });
  }

  removePhoto(): Promise<CurrentAppProfile> {
    return this.profile(photoPath, { method: "DELETE" });
  }

  private async profile(path: string, init: RequestInit): Promise<CurrentAppProfile> {
    const response = await this.request(path, init);
    return decodeProfile(await response.json());
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const response = await requestWithAppGrant(
      this.fetch,
      await this.config.accessToken(),
      new URL(path, this.origin),
      init,
    );
    if (!response.ok) throw new CurrentAppProfileError(response.status);
    return response;
  }
}

function requestWithAppGrant(
  fetcher: typeof globalThis.fetch,
  token: string,
  url: URL,
  init: RequestInit,
): Promise<Response> {
  if (!token || /\s/.test(token)) throw new TypeError("custd: application access token is required");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetcher(url, { ...init, headers, redirect: "error", credentials: "omit", cache: "no-store" });
}

function validatePhoto(photo: Blob): void {
  if (!["image/png", "image/webp"].includes(photo.type) || photo.size === 0 || photo.size > maxPhotoBytes) {
    throw new TypeError("custd: app profile photo must be PNG or WebP and at most 256 KiB");
  }
}

function decodeProfile(json: unknown): CurrentAppProfile {
  const record = requireRecord(json, profileContext);
  const fields = requireObjectList(record, "fields", profileContext).map(decodeField);
  if (record.managedPhoto === undefined) return { fields };
  return { fields, managedPhoto: requireBoolean(record, "managedPhoto", profileContext) };
}

function decodeField(record: Record<string, unknown>): CurrentAppProfileField {
  const field: CurrentAppProfileField = {
    fieldKey: requireString(record, "fieldKey", profileContext),
    present: requireBoolean(record, "present", profileContext),
    initialized: record.initialized === undefined ? false : requireBoolean(record, "initialized", profileContext),
    required: requireBoolean(record, "required", profileContext),
    editableBy: requireString(record, "editableBy", profileContext),
    editable: requireBoolean(record, "editable", profileContext),
  };
  optionalString(record, "value", profileContext);
  if (typeof record.value === "string") field.value = record.value;
  return field;
}
