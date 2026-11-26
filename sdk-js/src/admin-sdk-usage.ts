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

export type SdkUsageListResponse = { items: SdkUsageItem[] };

export type SdkVersionDeprecationRequest = { recommendedVersion: string; note: string };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class SdkUsageAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async list(options?: RequestOptions): Promise<SdkUsageListResponse> {
    const list = await this.request<SdkUsageListResponse>("GET", "/sdk-usage", undefined, options);
    return { items: list.items ?? [] };
  }

  /** Marks every release of `sdk` within `versionScope` deprecated. */
  putDeprecation(
    sdk: string,
    versionScope: string,
    body: SdkVersionDeprecationRequest,
    options?: RequestOptions,
  ): Promise<SdkVersionDeprecation> {
    return this.request("PUT", deprecationPath(sdk, versionScope), body, options);
  }

  deleteDeprecation(sdk: string, versionScope: string, options?: RequestOptions): Promise<void> {
    return this.request("DELETE", deprecationPath(sdk, versionScope), undefined, options);
  }
}

function deprecationPath(sdk: string, versionScope: string): string {
  return `/sdk-usage/deprecations/${encodeURIComponent(sdk)}/${encodeURIComponent(versionScope)}`;
}
