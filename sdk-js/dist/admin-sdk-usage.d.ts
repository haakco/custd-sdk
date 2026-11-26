/**
 * SDK usage by release, as Custd observes it from the `X-Custd-Sdk` header, and the deprecations
 * Custd announces for a release range.
 */
import type { RequestOptions } from "./index.js";
/** A deprecation recorded for every release of one SDK within `versionScope`. */
export type SdkVersionDeprecation = {
    sdk: string;
    versionScope: string;
    recommendedVersion: string;
    note: string;
    markedBy: string;
    deprecatedAt: string;
};
/** One SDK release seen in requests. */
export type SdkUsageItem = {
    sdk: string;
    version: string;
    state: string;
    requests: number;
    firstSeenAt: string;
    lastSeenAt: string;
    deprecation?: SdkVersionDeprecation;
};
export type SdkUsageListResponse = {
    items: SdkUsageItem[];
};
export type SdkVersionDeprecationRequest = {
    recommendedVersion: string;
    note: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class SdkUsageAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(options?: RequestOptions): Promise<SdkUsageListResponse>;
    /** Marks every release of `sdk` within `versionScope` deprecated. */
    putDeprecation(sdk: string, versionScope: string, body: SdkVersionDeprecationRequest, options?: RequestOptions): Promise<SdkVersionDeprecation>;
    deleteDeprecation(sdk: string, versionScope: string, options?: RequestOptions): Promise<void>;
}
export {};
