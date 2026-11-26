import type { MachineAccessAdminClient, MachineAccessCompanyPolicy, MachineAccessCompanyUpdateRequest, MachineAccessEffective, MachineAccessMachinePolicy, MachineAccessMachineUpdateRequest } from "@haakco/custd-sdk";
import { type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
/**
 * Query keys of the machine access reads, so an app can invalidate them after a change it made
 * elsewhere. `effective()` covers every machine's effective access.
 */
export declare const machineAccessQueryKeys: {
    company: (companySlug?: string) => readonly ["custd", "machine-access", "company", string];
    override: (clientId: string) => readonly ["custd", "machine-access", "override", string];
    effective: (clientId?: string) => readonly ["custd", "machine-access", "effective"] | readonly ["custd", "machine-access", "effective", string];
};
/** The company's machine access policy. A tenant administrator omits companySlug. */
export declare function useMachineAccess(client: MachineAccessAdminClient, companySlug?: string): UseQueryResult<MachineAccessCompanyPolicy, Error>;
/** Changes the company policy; every machine's effective access is read again after it. */
export declare function useUpdateMachineAccess(client: MachineAccessAdminClient, companySlug?: string): UseMutationResult<MachineAccessCompanyPolicy, Error, MachineAccessCompanyUpdateRequest>;
/** One machine's per-area override. */
export declare function useMachineAccessOverride(client: MachineAccessAdminClient, clientId: string): UseQueryResult<MachineAccessMachinePolicy, Error>;
/** Changes one machine's override; that machine's effective access is read again after it. */
export declare function useUpdateMachineAccessOverride(client: MachineAccessAdminClient, clientId: string): UseMutationResult<MachineAccessMachinePolicy, Error, MachineAccessMachineUpdateRequest>;
/** What one machine may do in each area and which setting decided it. */
export declare function useEffectiveMachineAccess(client: MachineAccessAdminClient, clientId: string): UseQueryResult<MachineAccessEffective, Error>;
