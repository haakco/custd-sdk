// @vitest-environment jsdom
import type { SiteUptimeHistory } from "@haakco/custd-sdk";
import { keepPreviousData, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SiteLighthousePanel, SiteStatusPageView, SiteUptimePanel } from "./index.js";

afterEach(cleanup);

const time = "2026-11-27T00:00:00Z";

it("loads and retries uptime with the selected range and applies client labels and theme", async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const success = { checks: 10, upChecks: 9 };
  const noChecks = { checks: 0, upChecks: 0 };
  const loadHistory = vi
    .fn(
      async (responseDays: number, _signal: AbortSignal): Promise<SiteUptimeHistory> => ({
        domainUuid: "example",
        generatedAt: time,
        responseDays,
        windows: { last24h: success, last7d: success, last30d: noChecks },
        days: [{ date: "2026-11-27", ...success }],
        hours: [{ hourStart: time, ...success, avgMs: responseDays, maxMs: 99 }],
      }),
    )
    .mockRejectedValueOnce(new Error("Temporary failure"));
  render(
    <QueryClientProvider client={queryClient}>
      <SiteUptimePanel
        queryKey={["session", "example"]}
        loadHistory={loadHistory}
        className="brand-card"
        style={{ color: "rebeccapurple" }}
        labels={{ title: "Availability", retry: "Try again", range: "Lookback" }}
        dailyChart={{ formatDayLabel: () => "One failed check" }}
        responseChart={{ formatSummary: ({ averageMs }) => `Typical response ${averageMs} ms` }}
      />
    </QueryClientProvider>,
  );

  expect(screen.getByRole("status").textContent).toContain("Loading");
  const panel = screen.getByRole("region", { name: "Availability" });
  expect(panel.className).toBe("brand-card");
  expect(panel.style.color).toBe("rebeccapurple");
  await within(panel).findByRole("alert");
  fireEvent.click(within(panel).getByRole("button", { name: "Try again" }));
  await within(panel).findByRole("img", { name: "Typical response 7 ms" });
  expect(within(panel).getByRole("listitem", { name: "One failed check" }).dataset.state).toBe("down");
  fireEvent.change(within(panel).getByRole("combobox", { name: "Lookback" }), { target: { value: "30" } });
  await within(panel).findByRole("img", { name: "Typical response 30 ms" });
  expect(loadHistory.mock.calls.map(([days]) => days)).toEqual([7, 7, 30]);
  queryClient.clear();
});

it("does not show another scope's uptime while loading, even with global keepPreviousData", async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { placeholderData: keepPreviousData } } });
  const checks = { checks: 2, upChecks: 2 };
  const loadFirst = async (): Promise<SiteUptimeHistory> => ({
    domainUuid: "example",
    generatedAt: time,
    responseDays: 7,
    windows: { last24h: checks, last7d: checks, last30d: checks },
    days: [{ date: "2026-11-27", ...checks }],
    hours: [],
  });
  const renderPanel = (scope: string, loadHistory: () => Promise<SiteUptimeHistory>) => (
    <QueryClientProvider client={queryClient}>
      <SiteUptimePanel queryKey={[scope, "example"]} loadHistory={loadHistory} />
    </QueryClientProvider>
  );
  const rendered = render(renderPanel("first", loadFirst));
  await screen.findByRole("list", { name: "Daily uptime" });
  rendered.rerender(renderPanel("second", () => new Promise(() => {})));
  expect(screen.getByRole("status").textContent).toContain("Loading");
  expect(screen.queryByRole("list", { name: "Daily uptime" })).toBeNull();
  queryClient.clear();
});

it("renders custom public status labels and Lighthouse formatting from typed payloads", () => {
  render(
    <>
      <SiteStatusPageView
        className="brand-card"
        page={{
          title: "Service status",
          components: [{ label: "Sign in", status: "down" }],
          updates: [{ publishedAt: time, message: "Investigating" }],
        }}
        statusLabels={{ down: "Interrupted" }}
        formatTime={() => "27 November"}
      />
      <SiteLighthousePanel
        history={{
          domainUuid: "example",
          url: "https://example.com",
          days: 7,
          pages: [],
          runs: [
            {
              profile: "desktop",
              outcome: "success",
              url: "https://example.com",
              observedAt: time,
              durationMs: 100,
              scores: { performance: 91 },
              metrics: {},
            },
          ],
        }}
        labels={{ title: "Page speed", mobile: "Phone" }}
        formatScore={(score) => `${score} points`}
      />
    </>,
  );
  const status = within(screen.getByRole("region", { name: "Service status" }));
  expect(status.getByText("Interrupted").closest("li")?.dataset.state).toBe("down");
  expect(status.getByText("27 November").getAttribute("datetime")).toBe(time);
  const lighthouse = within(screen.getByRole("region", { name: "Page speed" }));
  expect(lighthouse.getByText("91 points")).toBeTruthy();
  expect(lighthouse.getByRole("heading", { name: "Phone" })).toBeTruthy();
  expect(lighthouse.getByText("No runs yet.")).toBeTruthy();
});
