import type {
  MachineAccessAdminClient,
  MachineAccessCompanyPolicy,
  MachineAccessCompanyUpdateRequest,
  MachineAccessEffective,
  MachineAccessMachinePolicy,
  MachineAccessMachineUpdateRequest,
} from "@haakco/custd-sdk";
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Query keys of the machine access reads, so an app can invalidate them after a change it made
 * elsewhere. `effective()` covers every machine's effective access.
 */
export const machineAccessQueryKeys = {
  company: (companySlug = "") => ["custd", "machine-access", "company", companySlug] as const,
  override: (clientId: string) => ["custd", "machine-access", "override", clientId] as const,
  effective: (clientId?: string) =>
    clientId === undefined
      ? (["custd", "machine-access", "effective"] as const)
      : (["custd", "machine-access", "effective", clientId] as const),
};

/** The company's machine access policy. A tenant administrator omits companySlug. */
export function useMachineAccess(
  client: MachineAccessAdminClient,
  companySlug?: string,
): UseQueryResult<MachineAccessCompanyPolicy, Error> {
  return useQuery({
    queryKey: machineAccessQueryKeys.company(companySlug),
    queryFn: ({ signal }) => client.get(companySlug, { signal }),
  });
}

/** Changes the company policy; every machine's effective access is read again after it. */
export function useUpdateMachineAccess(
  client: MachineAccessAdminClient,
  companySlug?: string,
): UseMutationResult<MachineAccessCompanyPolicy, Error, MachineAccessCompanyUpdateRequest> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => client.update(body, companySlug),
    onSuccess: async (saved) => {
      queryClient.setQueryData(machineAccessQueryKeys.company(companySlug), saved);
      await queryClient.invalidateQueries({ queryKey: machineAccessQueryKeys.effective() });
    },
  });
}

/** One machine's per-area override. */
export function useMachineAccessOverride(
  client: MachineAccessAdminClient,
  clientId: string,
): UseQueryResult<MachineAccessMachinePolicy, Error> {
  return useQuery({
    queryKey: machineAccessQueryKeys.override(clientId),
    queryFn: ({ signal }) => client.getOverride(clientId, { signal }),
    enabled: clientId !== "",
  });
}

/** Changes one machine's override; that machine's effective access is read again after it. */
export function useUpdateMachineAccessOverride(
  client: MachineAccessAdminClient,
  clientId: string,
): UseMutationResult<MachineAccessMachinePolicy, Error, MachineAccessMachineUpdateRequest> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => client.updateOverride(clientId, body),
    onSuccess: async (saved) => {
      queryClient.setQueryData(machineAccessQueryKeys.override(clientId), saved);
      await queryClient.invalidateQueries({ queryKey: machineAccessQueryKeys.effective(clientId) });
    },
  });
}

/** What one machine may do in each area and which setting decided it. */
export function useEffectiveMachineAccess(
  client: MachineAccessAdminClient,
  clientId: string,
): UseQueryResult<MachineAccessEffective, Error> {
  return useQuery({
    queryKey: machineAccessQueryKeys.effective(clientId),
    queryFn: ({ signal }) => client.getEffective(clientId, { signal }),
    enabled: clientId !== "",
  });
}
