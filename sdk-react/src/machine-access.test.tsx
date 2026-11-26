// @vitest-environment jsdom
import { CustdClient } from "@haakco/custd-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEffectiveMachineAccess, useUpdateMachineAccess, useUpdateMachineAccessOverride } from "./machine-access.js";

const effective = {
  companySlug: "acme",
  clientId: "ci-1",
  scopes: ["admin"],
  allowedAreas: 8,
  totalAreas: 8,
  areas: null,
};
const policy = { companySlug: "acme", allowSupportAutomation: false, areas: [] };
const override = { companySlug: "acme", clientId: "ci-1", areas: [] };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function setup() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/effective")) return json(effective);
    if (init?.method === "PUT" && url.includes("/clients/")) return json(override);
    return json(policy);
  });
  const custd = new CustdClient({ baseUrl: "https://api.custd.com", getToken: () => "t", fetch: fetchMock });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const effectiveReads = () => fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/effective")).length;
  return { client: custd.admin.machineAccess, wrapper, effectiveReads };
}

afterEach(cleanup);

describe("machine access hooks", () => {
  it("reads a machine's effective access with empty lists for null", async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useEffectiveMachineAccess(client, "ci-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.areas).toEqual([]);
  });

  it("a company or a machine change refreshes the machine's effective access", async () => {
    const { client, wrapper, effectiveReads } = setup();
    const { result } = renderHook(
      () => ({
        effective: useEffectiveMachineAccess(client, "ci-1"),
        company: useUpdateMachineAccess(client, "acme"),
        machine: useUpdateMachineAccessOverride(client, "ci-1"),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.effective.isSuccess).toBe(true));

    await act(() => result.current.company.mutateAsync({ allowSupportAutomation: true }));
    await waitFor(() => expect(effectiveReads()).toBe(2));
    await act(() => result.current.machine.mutateAsync({ areas: [{ area: "reporting", state: "blocked" }] }));
    await waitFor(() => expect(effectiveReads()).toBe(3));
  });
});
