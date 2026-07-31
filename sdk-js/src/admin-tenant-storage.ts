// TenantStorageClient owns tenant-scoped storage location registration.
// Locations are server-prefixed: the SDK submits clientLocation and the
// server returns a serverAssignedPrefix that the SDK must use for raw
// landing writes. Tenant is derived from the auth context; wrong-tenant
// reads collapse to an empty list indistinguishable from "no locations".

import type { RequestOptions } from "./index.js";

export type TenantStorageLocation = {
  id: string;
  tenantSlug: string;
  clientLocation: string;
  serverAssignedPrefix: string;
  status: string;
  createdAt?: string;
  expiresAt?: string;
};

export type TenantStorageListResponse = {
  locations: TenantStorageLocation[];
};

// TenantStorageCreateRequest is the body for POST /tenant-storage-locations.
// TenantSlug is server-derived; the SDK sends it for tests but the server
// is the authority for which tenant the location belongs to.
export type TenantStorageCreateRequest = {
  tenantSlug?: string;
  clientLocation: string;
};

type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class TenantStorageClient {
  constructor(private readonly request: NonAdminRequester) {}

  list(options?: RequestOptions): Promise<TenantStorageListResponse> {
    return this.request("GET", "/tenant-storage-locations", undefined, options);
  }

  create(body: TenantStorageCreateRequest, options?: RequestOptions): Promise<TenantStorageLocation> {
    return this.request("POST", "/tenant-storage-locations", body, options);
  }

  get(id: string, options?: RequestOptions): Promise<TenantStorageLocation> {
    return this.request("GET", `/tenant-storage-locations/${encodeURIComponent(id)}`, undefined, options);
  }

  // Revoke removes a tenant storage location. The server is the authority for
  // whether the prefix is immediately unusable; the SDK must not assume
  // partial deletes are atomic.
  revoke(id: string, options?: RequestOptions): Promise<void> {
    return this.request("DELETE", `/tenant-storage-locations/${encodeURIComponent(id)}`, undefined, options);
  }
}
