// @vitest-environment jsdom
import { AppItemsClient } from "@haakco/custd-sdk/browser";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppForecast, useAppItem, useAppMeeting } from "./app-items.js";
import { CustdHostedAppProvider } from "./hosted-app.js";

const API = "https://api.custd.com";
const SHARE = "s".repeat(43);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const itemRead = { item: { itemUuid: "i1", kind: "measurement_project", role: "share", version: 3 } };

function api() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/.well-known/custd.json")) {
      return json({
        apiBaseUrl: API,
        host: "counter.apps.custd.com",
        siteUuid: "site",
        browserKey: "site_pk_key",
        environment: "prod",
        capabilities: ["app_data"],
      });
    }
    if (url === `${API}/api/v1/app/item`) return json(itemRead);
    if (url === `${API}/api/v1/app/forecast/latest`) return json({ code: "app_forecast_missing" }, 404);
    return json({}, 404);
  });
}

function Version({ token }: { token?: string }) {
  const item = useAppItem(token);
  return <p>{item.status === "fresh" ? `v${item.data.item.version}` : item.status}</p>;
}

function Forecast() {
  const forecast = useAppForecast(SHARE);
  return <p>{forecast.status === "empty" ? "no forecast yet" : forecast.status}</p>;
}

afterEach(cleanup);

describe("useAppItem", () => {
  it("is idle without a token and reports app data unavailable outside a provider", () => {
    render(
      <>
        <Version />
        <Version token={SHARE} />
      </>,
    );
    expect(screen.getByText("idle")).toBeTruthy();
    expect(screen.getByText("error")).toBeTruthy();
  });

  it("reads through the provider's app, with one shared request for every watcher", async () => {
    const fetchMock = api();
    render(
      <CustdHostedAppProvider
        options={{ discoveryUrl: "https://counter.apps.custd.com/.well-known/custd.json", fetch: fetchMock }}
      >
        <Version token={SHARE} />
        <Version token={SHARE} />
        <Forecast />
      </CustdHostedAppProvider>,
    );

    await waitFor(() => expect(screen.getAllByText("v3")).toHaveLength(2));
    await waitFor(() => expect(screen.getByText("no forecast yet")).toBeTruthy());
    const itemReads = fetchMock.mock.calls.filter(([url]) => String(url) === `${API}/api/v1/app/item`);
    expect(itemReads).toHaveLength(1);
  });

  it("uses an explicit client without a provider", async () => {
    const fetchMock = api();
    const client = new AppItemsClient({ apiBaseUrl: API, siteKey: "site_pk_key", fetch: fetchMock });
    function Explicit() {
      const item = useAppItem(SHARE, { client });
      return <p>{item.status === "fresh" ? "ready" : item.status}</p>;
    }
    render(<Explicit />);
    await waitFor(() => expect(screen.getByText("ready")).toBeTruthy());
  });
});

describe("useAppMeeting", () => {
  const OWNER = "o".repeat(43);
  const meetingRead = {
    item: { itemUuid: "m1", kind: "meeting", role: "owner", version: 4 },
    meeting: {
      name: "Standup",
      status: "running",
      currentBlockUuid: "b1",
      blocks: [],
      summary: { predictedMs: 60000, finishedPredictedMs: 0, finishedActualMs: 0, finishedBlocks: 0, overrunMs: 0 },
    },
  };

  it("reads the meeting through the item's shared poller, and refuses an item of another kind", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      return json(headers.Authorization === `Bearer ${OWNER}` ? meetingRead : itemRead);
    });
    const client = new AppItemsClient({ apiBaseUrl: API, siteKey: "site_pk_key", fetch: fetchMock });
    function Meeting({ token }: { token: string }) {
      const meeting = useAppMeeting(token, { client });
      if (meeting.status === "fresh") return <p>{`${meeting.data.name} on ${meeting.data.currentBlockUuid}`}</p>;
      return <p>{meeting.status === "error" ? meeting.error.code : meeting.status}</p>;
    }
    function ItemVersion() {
      const item = useAppItem(OWNER, { client });
      return <p>{item.status === "fresh" ? `v${item.data.item.version}` : item.status}</p>;
    }
    render(
      <>
        <Meeting token={OWNER} />
        <ItemVersion />
        <Meeting token={SHARE} />
      </>,
    );

    await waitFor(() => expect(screen.getByText("Standup on b1")).toBeTruthy());
    expect(screen.getByText("v4")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("app_item_wrong_kind")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
