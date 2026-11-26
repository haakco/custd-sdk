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
export declare class TenantStorageClient {
    private readonly request;
    constructor(request: NonAdminRequester);
    /** Lists the caller tenant's locations; another tenant's are never visible. */
    list(options?: RequestOptions): Promise<TenantStorageListResponse>;
    /** Asks the server to assign the caller tenant a new location. */
    create(options?: RequestOptions): Promise<TenantStorageLocation>;
    get(id: number, options?: RequestOptions): Promise<TenantStorageLocation>;
    /** Revokes a location. The server decides when its prefix stops being usable. */
    revoke(id: number, options?: RequestOptions): Promise<void>;
}
export {};
