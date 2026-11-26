/**
 * The tenant's environment policy: which environment values are active, which are disabled, whether
 * new values are created automatically, and why the policy is in its current state.
 */
import type { RequestOptions } from "./index.js";
export type EnvironmentPolicyReason = {
    code: string;
    summary: string;
    remedy: string;
};
export type EnvironmentPolicy = {
    definitionPresent: boolean;
    definitionEnabled: boolean;
    autoCreateEnvironments: boolean;
    activeCount: number;
    activeValueLimit: number;
    activeValues: string[];
    disabledValues: string[];
    reasons: EnvironmentPolicyReason[];
};
/** `autoCreateEnvironments: null` leaves the setting unchanged. */
export type EnvironmentPolicyUpdateRequest = {
    autoCreateEnvironments: boolean | null;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class EnvironmentPolicyAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    get(companySlug?: string, options?: RequestOptions): Promise<EnvironmentPolicy>;
    update(body: EnvironmentPolicyUpdateRequest, companySlug?: string, options?: RequestOptions): Promise<EnvironmentPolicy>;
}
export {};
