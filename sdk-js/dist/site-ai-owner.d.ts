import type { SiteAIConsentRequest, SiteAIOwnerHandoff, SiteAISettings, SiteAISettingsRequest } from "./admin-site-ai.js";
import type { RequestOptions } from "./index.js";
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
export declare class SiteAIOwnerSession {
    private readonly transport;
    private readonly origin;
    private readonly handle;
    private binding;
    constructor(transport: SiteAIOwnerTransport, origin: string, handle: string);
    /** Reads the session tenant's AI settings and refreshes the write binding. */
    getSettings(options?: RequestOptions): Promise<SiteAIOwnerSettings>;
    /** Replaces the session tenant's AI mode and cap. */
    setSettings(body: SiteAISettingsRequest, options?: RequestOptions): Promise<SiteAISettings>;
    /** Records or revokes the session tenant's AI terms consent. */
    setConsent(body: SiteAIConsentRequest, options?: RequestOptions): Promise<SiteAISettings>;
    private write;
    private send;
}
/** Opens an owner session from a handoff. hubOrigin is the broker's registered hub origin. */
export declare function redeemSiteAIOwnerHandoff(transport: SiteAIOwnerTransport, handoff: SiteAIOwnerHandoff, hubOrigin: string, options?: RequestOptions): Promise<SiteAIOwnerSession>;
