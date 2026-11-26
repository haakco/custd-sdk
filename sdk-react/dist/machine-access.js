import { useMutation, useQuery, useQueryClient, } from "@tanstack/react-query";
/**
 * Query keys of the machine access reads, so an app can invalidate them after a change it made
 * elsewhere. `effective()` covers every machine's effective access.
 */
export const machineAccessQueryKeys = {
    company: (companySlug = "") => ["custd", "machine-access", "company", companySlug],
    override: (clientId) => ["custd", "machine-access", "override", clientId],
    effective: (clientId) => clientId === undefined
        ? ["custd", "machine-access", "effective"]
        : ["custd", "machine-access", "effective", clientId],
};
/** The company's machine access policy. A tenant administrator omits companySlug. */
export function useMachineAccess(client, companySlug) {
    return useQuery({
        queryKey: machineAccessQueryKeys.company(companySlug),
        queryFn: ({ signal }) => client.get(companySlug, { signal }),
    });
}
/** Changes the company policy; every machine's effective access is read again after it. */
export function useUpdateMachineAccess(client, companySlug) {
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
export function useMachineAccessOverride(client, clientId) {
    return useQuery({
        queryKey: machineAccessQueryKeys.override(clientId),
        queryFn: ({ signal }) => client.getOverride(clientId, { signal }),
        enabled: clientId !== "",
    });
}
/** Changes one machine's override; that machine's effective access is read again after it. */
export function useUpdateMachineAccessOverride(client, clientId) {
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
export function useEffectiveMachineAccess(client, clientId) {
    return useQuery({
        queryKey: machineAccessQueryKeys.effective(clientId),
        queryFn: ({ signal }) => client.getEffective(clientId, { signal }),
        enabled: clientId !== "",
    });
}
