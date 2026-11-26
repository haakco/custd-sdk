/**
 * The tenant's environment policy: which environment values are active, which are disabled, whether
 * new values are created automatically, and why the policy is in its current state.
 */

import type { RequestOptions } from "./index.js";

export type EnvironmentPolicyReason = { code: string; summary: string; remedy: string };

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
export type EnvironmentPolicyUpdateRequest = { autoCreateEnvironments: boolean | null };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class EnvironmentPolicyAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async get(companySlug?: string, options?: RequestOptions): Promise<EnvironmentPolicy> {
    return normalizePolicy(await this.request("GET", policyPath(companySlug), undefined, options));
  }

  async update(
    body: EnvironmentPolicyUpdateRequest,
    companySlug?: string,
    options?: RequestOptions,
  ): Promise<EnvironmentPolicy> {
    return normalizePolicy(await this.request("PATCH", policyPath(companySlug), body, options));
  }
}

function policyPath(companySlug?: string): string {
  return companySlug ? `/environment-policy?companySlug=${encodeURIComponent(companySlug)}` : "/environment-policy";
}

function normalizePolicy(policy: EnvironmentPolicy): EnvironmentPolicy {
  return {
    ...policy,
    activeValues: policy.activeValues ?? [],
    disabledValues: policy.disabledValues ?? [],
    reasons: policy.reasons ?? [],
  };
}
