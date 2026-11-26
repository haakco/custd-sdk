/**
 * Reads that carry none of the client's own credentials: a hosted app's public discovery document, a
 * shared site report opened by its link token, and the auth-domain inventory an external checker probes
 * with its monitoring key.
 */
import type { SiteReport } from "./admin-site-insights.js";
import type { RequestOptions } from "./index.js";
/** Carries the external checker's monitoring key, its only credential. */
export declare const AUTH_DOMAIN_MONITORING_KEY_HEADER = "X-Custd-Auth-Domain-Monitoring-Key";
/**
 * A hosted app's browser sign-in registration. Pages use the authorization-code flow with PKCE and
 * send the access token to the app item routes as X-Custd-User-Token.
 */
export type AppDiscoverySignIn = {
    issuer: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    endSessionEndpoint: string;
    clientId: string;
    audience: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
};
/** A hosted app's public /.well-known/custd.json: where its API is, its public Site key and what it can do. */
export type AppDiscoveryDocument = {
    apiBaseUrl: string;
    host: string;
    siteUuid: string;
    browserKey: string;
    environment: string;
    capabilities: string[];
    signIn?: AppDiscoverySignIn;
    identityMode: string;
    allowedOrigins: string[];
    pageViewSchemaVersion?: string;
};
/**
 * The realm hostnames the external checker probes. A host that leaves `hosts` without appearing in
 * `retiredHosts` was lost, not retired.
 */
export type AuthDomainMonitoringInventory = {
    hosts: string[];
    retiredHosts: string[];
};
/** Issues a GET with no client credential, adding only the headers given. */
export type PublicReader = <T>(path: string, headers: Record<string, string>, options?: RequestOptions) => Promise<T>;
export declare class PublicReadClient {
    private readonly read;
    constructor(read: PublicReader);
    /** Reads a hosted app's public discovery document by host. A host that serves no app answers 404. */
    appDiscovery(host: string, options?: RequestOptions): Promise<AppDiscoveryDocument>;
    /** Reads the site report a share link opens. The share token is the only authority. */
    sharedSiteReport(token: string, options?: RequestOptions): Promise<SiteReport>;
    /** Returns the realm hostnames the external checker may probe. */
    authDomainMonitoringInventory(monitoringKey: string, options?: RequestOptions): Promise<AuthDomainMonitoringInventory>;
}
