// The AI settings session a data-space owner opens by redeeming a handoff the broker created with
// admin.siteDomains.createAIOwnerHandoff. Redeeming runs on the broker's hub server: it sends the
// hub origin and reads the session cookie, which a browser page cannot do. The session then carries
// its own cookie and write binding and never sends a Custd client credential or an acting company.

import type {
  SiteAIConsentRequest,
  SiteAIOwnerHandoff,
  SiteAISettings,
  SiteAISettingsRequest,
} from "./admin-site-ai.js";
import type { RequestOptions } from "./index.js";
import { secureOrLocalUrl } from "./secure-url.js";
import { SDK_IDENTITY } from "./version.js";

const siteAIOwnerPath = "/api/v1/site-ai-owner";
const siteAIOwnerCookie = "__Host-custd-site-ai-owner";
const siteAIOwnerBindingHeader = "X-Custd-Site-AI-Session";

/** The session's tenant, the binding its writes must echo and the tenant's current AI settings. */
export type SiteAIOwnerSettings = {
  tenantSlug: string;
  sessionBinding: string;
  settings: SiteAISettings;
};

/** How the session sends requests and turns a refused response into the client's request error. */
export type SiteAIOwnerTransport = {
  fetch: typeof fetch;
  failure: (response: Response) => Promise<Error>;
};

/**
 * A signed-in AI settings session for one tenant, valid for ten minutes after redeeming. Open one with
 * CustdClient.redeemSiteAIOwnerHandoff.
 */
export class SiteAIOwnerSession {
  private binding = "";

  constructor(
    private readonly transport: SiteAIOwnerTransport,
    private readonly origin: string,
    private readonly handle: string,
  ) {}

  /** Reads the session tenant's AI settings and refreshes the write binding. */
  async getSettings(options?: RequestOptions): Promise<SiteAIOwnerSettings> {
    const settings = await this.send<SiteAIOwnerSettings>("GET", "/settings", undefined, options);
    this.binding = settings.sessionBinding;
    return settings;
  }

  /** Replaces the session tenant's AI mode and cap. */
  setSettings(body: SiteAISettingsRequest, options?: RequestOptions): Promise<SiteAISettings> {
    return this.write("/settings", body, options);
  }

  /** Records or revokes the session tenant's AI terms consent. */
  setConsent(body: SiteAIConsentRequest, options?: RequestOptions): Promise<SiteAISettings> {
    return this.write("/consent", body, options);
  }

  // A write needs the binding, so the first write after redeeming reads the settings once.
  private async write(path: string, body: unknown, options?: RequestOptions): Promise<SiteAISettings> {
    if (this.binding === "") await this.getSettings(options);
    return this.send("PUT", path, body, options);
  }

  private async send<T>(method: string, path: string, body: unknown, options?: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      Cookie: `${siteAIOwnerCookie}=${this.handle}`,
      "X-Custd-Sdk": SDK_IDENTITY,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      headers.Origin = this.origin;
      headers[siteAIOwnerBindingHeader] = this.binding;
    }
    const response = await this.transport.fetch(`${this.origin}${siteAIOwnerPath}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });
    if (!response.ok) throw await this.transport.failure(response);
    return (await response.json()) as T;
  }
}

/** Opens an owner session from a handoff. hubOrigin is the broker's registered hub origin. */
export async function redeemSiteAIOwnerHandoff(
  transport: SiteAIOwnerTransport,
  handoff: SiteAIOwnerHandoff,
  hubOrigin: string,
  options?: RequestOptions,
): Promise<SiteAIOwnerSession> {
  const origin = redeemOrigin(handoff.redeemUrl);
  if (handoff.code === "" || hubOrigin === "") {
    throw new Error("custd: AI owner handoff requires a code and the hub origin");
  }
  const response = await transport.fetch(handoff.redeemUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: hubOrigin, "X-Custd-Sdk": SDK_IDENTITY },
    body: new URLSearchParams({ code: handoff.code }).toString(),
    redirect: "manual",
    signal: options?.signal,
  });
  if (!response.ok && response.status !== 303) throw await transport.failure(response);
  if (response.status !== 303) throw new Error(`custd: AI owner redeem returned HTTP ${response.status}, want 303`);
  const handle = sessionHandle(response.headers);
  if (handle === "") throw new Error("custd: AI owner redeem returned no session cookie");
  return new SiteAIOwnerSession(transport, origin, handle);
}

function redeemOrigin(redeemUrl: string): string {
  const url = secureOrLocalUrl(redeemUrl);
  if (url?.pathname !== `${siteAIOwnerPath}/redeem`) {
    throw new Error("custd: AI owner handoff requires the Custd redeem URL");
  }
  return url.origin;
}

function sessionHandle(headers: Headers): string {
  for (const cookie of headers.getSetCookie()) {
    const [pair = ""] = cookie.split(";", 1);
    const separator = pair.indexOf("=");
    if (separator > 0 && pair.slice(0, separator).trim() === siteAIOwnerCookie) return pair.slice(separator + 1).trim();
  }
  return "";
}
