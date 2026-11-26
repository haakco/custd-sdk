// TenantStorageClient manages the caller tenant's storage locations. The server derives the tenant
// from the credential and assigns every location's bucket, root prefix and isolation tier; the caller
// chooses none of them.

import type { RequestOptions } from "./index.js";

/** One storage location the server assigned to the caller's tenant. */
export type TenantStorageLocation = {
  id: number;
  uuid: string;
  companyId: number;
  code: string;
  isolationTier: string;
  provider: string;
  bucket: string;
  region: string;
  endpoint: string;
  rootPrefix: string;
  writeEnabled: boolean;
  validationStatus: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TenantStorageListResponse = {
  locations: TenantStorageLocation[];
};

type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class TenantStorageClient {
  constructor(private readonly request: NonAdminRequester) {}

  /** Lists the caller tenant's locations; another tenant's are never visible. */
  async list(options?: RequestOptions): Promise<TenantStorageListResponse> {
    const list = await this.request<TenantStorageListResponse>("GET", "/tenant-storage-locations", undefined, options);
    return { locations: list.locations ?? [] };
  }

  /** Asks the server to assign the caller tenant a new location. */
  create(options?: RequestOptions): Promise<TenantStorageLocation> {
    return this.request("POST", "/tenant-storage-locations", {}, options);
  }

  get(id: number, options?: RequestOptions): Promise<TenantStorageLocation> {
    return this.request("GET", `/tenant-storage-locations/${id}`, undefined, options);
  }

  /** Revokes a location. The server decides when its prefix stops being usable. */
  revoke(id: number, options?: RequestOptions): Promise<void> {
    return this.request("DELETE", `/tenant-storage-locations/${id}`, undefined, options);
  }
}
