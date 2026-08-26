export type RuntimeReadinessOAuthConfig = {
    name: string;
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    audience?: string;
    scopes?: string[];
};
export type RuntimeReadinessCredentialResult = {
    name: string;
    tenantSlug: string;
    tokenIssued: true;
};
export type RuntimeReadinessResult = {
    ready: true;
    tenantSlug: string;
    eventTypeSlug: string;
    schemaVersion: string;
    credentials: RuntimeReadinessCredentialResult[];
};
export type RuntimeReadinessOptions = {
    baseUrl: string;
    schemaUrl?: string;
    tenantSlug: string;
    eventTypeSlug: string;
    schemaVersion: string;
    oauth: RuntimeReadinessOAuthConfig[];
    fetch?: typeof fetch;
};
export declare function checkRuntimeReadiness(options: RuntimeReadinessOptions): Promise<RuntimeReadinessResult>;
