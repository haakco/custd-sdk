import { describe, expect, it } from "vitest";
import { APP_ALERT_DESTINATION_KINDS, APP_ALERT_RULE_TYPES } from "../app-alerts.js";
import {
  APP_ITEM_ERROR_CODES,
  APP_ITEM_KINDS,
  type AppItemCreated,
  AppItemError,
  AppItemsClient,
} from "../app-items.js";
import { APP_MEETING_BLOCK_STATUSES, APP_MEETING_ERROR_CODES, APP_MEETING_STATUSES } from "../app-meetings.js";
import { APP_EVENT_OUTCOMES, HOSTED_APP_STATUSES, startHostedApp } from "../hosted-app.js";
import { FakeCustd, signInWithFake } from "../testing.js";

const DAY = 86_400_000;
const START = Date.parse("2026-01-01T00:00:00Z");

function clock() {
  let at = START;
  return { now: () => at, advance: (ms: number) => (at += ms) };
}

function project(fake: FakeCustd, user?: string): Promise<AppItemCreated> {
  return fake.appItemsClient({ userToken: user }).createItem({
    kind: APP_ITEM_KINDS.measurementProject,
    measurementProject: {
      kind: "deadline_forecast",
      name: "Launch",
      series: [{ seriesCode: "done", name: "Done", unitSlug: "count", completionDirection: "up", source: "manual" }],
      target: { targetCode: "t", name: "Ten", targetValue: 10, targetDate: "2026-01-20T00:00:00Z", state: "active" },
    },
  });
}

async function refusal(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(AppItemError);
  return (error as AppItemError).code;
}

describe("FakeCustd hosted app", () => {
  it("starts a hosted app and signs a user in through the real PKCE flow", async () => {
    const fake = new FakeCustd();
    const start = await startHostedApp(fake.hostedAppOptions());
    if (start.status !== HOSTED_APP_STATUSES.ready) throw start.error;
    expect(start.app.problems).toEqual([]);
    const signIn = start.app.signIn;
    if (!signIn) throw new Error("sign-in did not start");

    const session = await signInWithFake(fake, signIn, "alice");
    const created = await project(fake);
    await start.app.appItems?.claim(created.ownerToken);

    expect(session.accessToken).toBe("alice");
    const mine = await start.app.appItems?.listMyItems();
    expect(mine?.items?.map((item) => item.name)).toEqual(["Launch"]);
  });

  it("starts tracking and error capture as recorders, with nothing sent and no page hooks", async () => {
    const fake = new FakeCustd();
    const start = await startHostedApp(fake.hostedAppOptions());
    if (start.status !== HOSTED_APP_STATUSES.ready) throw start.error;

    const outcome = await start.app.trackAppEvent("task-done", { tasks: 3 });
    const captured = await start.app.errorCapture?.captureException({ error: new TypeError("x"), mode: "handled" });
    start.app.stop();

    expect(start.app.problems).toEqual([]);
    expect(outcome).toBe(APP_EVENT_OUTCOMES.tracked);
    expect(captured?.outcome).toBe("accepted");
    expect(fake.trackedEvents).toEqual([{ eventTypeSlug: "task-done", payload: { tasks: 3 } }]);
    expect(fake.capturedErrors).toEqual([{ exceptionType: "TypeError", mode: "handled" }]);
    expect(await start.app.trackAppEvent("task-done", { tasks: 4 })).toBe(APP_EVENT_OUTCOMES.trackingOff);
  });

  it("refuses a wrong site key and records what was sent without tokens in URLs", async () => {
    const fake = new FakeCustd();
    const stranger = new AppItemsClient({ apiBaseUrl: fake.apiBaseUrl, siteKey: "site_pk_other", fetch: fake.fetch });

    expect(await refusal(stranger.listMyItems())).toBe(APP_ITEM_ERROR_CODES.keyRefused);
    const created = await project(fake);
    await fake.appItemsClient().readItem(created.shareToken);

    const sent = fake.requests.filter((request) => request.method === "POST" && request.path === "/api/v1/app/items");
    expect(sent[0]?.json).toMatchObject({ kind: "measurement_project" });
    expect(fake.requests.every((request) => !request.url.includes(created.shareToken))).toBe(true);
  });
});

describe("FakeCustd app items", () => {
  it("answers 304 while the item holds and a new ETag after a change", async () => {
    const fake = new FakeCustd();
    const client = fake.appItemsClient();
    const { ownerToken, shareToken } = await project(fake);
    const first = await client.readItem(shareToken);
    if (first.status !== "modified") throw new Error("first read must be modified");

    const same = await client.readItem(shareToken, { etag: first.etag ?? "" });
    await client.addMeasurements(ownerToken, { rows: [{ observedAt: "2026-01-02T00:00:00Z", value: 1 }] });
    const changed = await client.readItem(shareToken, { etag: first.etag ?? "" });

    expect(same.status).toBe("not_modified");
    expect(changed.status).toBe("modified");
    expect(first.data.links).toBeUndefined();
  });

  it("keeps share links read-only and stops a rotated or revoked link", async () => {
    const fake = new FakeCustd();
    const client = fake.appItemsClient();
    const { ownerToken, shareToken, item } = await project(fake);
    const share = item.links?.find((link) => link.role === "share");
    if (!share) throw new Error("owner read lists links");

    expect(await refusal(client.cancel(shareToken))).toBe(APP_ITEM_ERROR_CODES.readOnlyLink);
    const rotated = await client.rotateLink(ownerToken, share.linkUuid);
    expect(await refusal(client.readItem(shareToken))).toBe(APP_ITEM_ERROR_CODES.linkRefused);
    await client.revokeLink(ownerToken, rotated.link.linkUuid);
    expect(await refusal(client.readItem(rotated.token))).toBe(APP_ITEM_ERROR_CODES.linkRefused);
  });

  it("summarises estimates and shows dashboard entries through the collection link", async () => {
    const fake = new FakeCustd({ now: clock().now });
    const client = fake.appItemsClient();
    const counter = await project(fake);
    await client.createEstimate(counter.ownerToken, {
      lowDate: "2026-01-10T00:00:00Z",
      highDate: "2026-01-12T00:00:00Z",
    });
    await client.createEstimate(counter.ownerToken, {
      lowDate: "2026-01-14T00:00:00Z",
      highDate: "2026-01-16T00:00:00Z",
    });
    const dashboard = await client.createItem({ kind: APP_ITEM_KINDS.linkCollection });

    const entry = await client.addEntry(dashboard.ownerToken, { token: counter.shareToken });
    const viaDashboard = await client.readItem(dashboard.shareToken, { item: entry.itemUuid });

    if (viaDashboard.status !== "modified") throw new Error("entry read must be modified");
    expect(viaDashboard.data.item.role).toBe("share");
    expect(viaDashboard.data.estimates?.latest?.movementDays).toBe(4);
  });
});

describe("FakeCustd forecasts and models", () => {
  it("runs a deterministic straight-line forecast", async () => {
    const fake = new FakeCustd({ now: clock().now });
    const client = fake.appItemsClient();
    const { ownerToken, shareToken } = await project(fake);
    const rows = [1, 2, 3].map((day) => ({ observedAt: new Date(START + day * DAY).toISOString(), value: day }));
    await client.addMeasurements(ownerToken, { rows });

    const run = await client.runForecast(ownerToken);
    const latest = await client.latestForecast(shareToken);

    expect(run.percentiles.p50).toBe("2026-01-11T00:00:00.000Z");
    expect(run.counter?.rate?.perDay).toBeCloseTo(1);
    expect(latest.status === "modified" && latest.data.forecastRunUuid).toBe(run.forecastRunUuid);
  });

  it("runs and calculates a model from input midpoints", async () => {
    const fake = new FakeCustd();
    const client = fake.appItemsClient();
    const model = await client.createItem({
      kind: APP_ITEM_KINDS.uncertaintyModel,
      uncertaintyModel: {
        name: "Revenue",
        quantities: [
          { name: "users", kind: "input", input: { shape: "range", low: 80, high: 120, distribution: "normal" } },
          { name: "price", kind: "input", input: { shape: "point", value: 5 } },
          { name: "revenue", kind: "formula", formula: "users * price" },
        ],
      },
    });

    const run = await client.runModel(model.ownerToken, { seed: 1, sensitivityOutput: "revenue" });
    const calculated = await client.calculateModel(model.shareToken, {
      inputs: [{ name: "price", input: { shape: "point", value: 10 } }],
      outputs: ["revenue"],
    });

    expect(run.quantities?.find((quantity) => quantity.name === "revenue")?.summary?.mean).toBe(500);
    expect(run.sensitivity?.inputs?.map((input) => input.name)).toEqual(["users", "price"]);
    expect(calculated.quantities?.map((quantity) => quantity.summary?.mean)).toEqual([1000]);
  });
});

describe("FakeCustd alerts and meetings", () => {
  it("delivers to webhooks and the subscribed owner when a rule crosses", async () => {
    const fake = new FakeCustd();
    const client = fake.appItemsClient({ userToken: "alice" });
    const { ownerToken } = await project(fake, "alice");
    await client.addAlertRule(ownerToken, { type: APP_ALERT_RULE_TYPES.targetReached });
    const hook = await client.addAlertWebhook(ownerToken, { endpoint: "https://hooks.example.com/custd" });
    const slack = await client.addAlertSlack(ownerToken, { webhookUrl: "https://hooks.slack.com/services/T0/B0/x" });
    await client.subscribeAlertEmail(ownerToken);

    await client.addMeasurements(ownerToken, { rows: [{ observedAt: "2026-01-02T00:00:00Z", value: 10 }] });
    const settings = await client.alertSettings(ownerToken);
    const deliveries = await client.alertDeliveries(ownerToken);

    expect(hook.signingSecret).toMatch(/^whsec_/);
    expect(slack.kind).toBe(APP_ALERT_DESTINATION_KINDS.slack);
    expect(slack.endpoint).not.toContain("/x");
    expect(settings.subscription).toBeDefined();
    expect(settings.webhooks?.map((destination) => destination.kind)).toEqual(["webhook", "slack"]);
    expect(deliveries.deliveries?.map((delivery) => delivery.channel).sort()).toEqual(["email", "slack", "webhook"]);
  });

  it("starts, advances and ends a meeting with stale steps refused", async () => {
    const time = clock();
    const fake = new FakeCustd({ now: time.now });
    const client = fake.appItemsClient();
    const meeting = await client.createItem({
      kind: APP_ITEM_KINDS.meeting,
      meeting: { name: "Standup", blocks: ["a", "b", "c"].map((title) => ({ title, predictedMs: 60_000 })) },
    });
    const started = await client.startMeeting(meeting.ownerToken);
    const first = started.meeting?.currentBlockUuid ?? "";
    time.advance(90_000);

    const advanced = await client.advanceMeeting(meeting.ownerToken, { blockUuid: first });
    const repeated = await client.advanceMeeting(meeting.ownerToken, { blockUuid: first });
    const stale = await refusal(client.advanceMeeting(meeting.ownerToken, { blockUuid: "not-on" }));
    const ended = await client.endMeeting(meeting.ownerToken);

    expect(advanced.meeting?.blocks?.[1]?.allocatedMs).toBe(30_000);
    expect(repeated.item.version).toBe(advanced.item.version);
    expect(stale).toBe(APP_MEETING_ERROR_CODES.stepRefused);
    expect(ended.meeting?.status).toBe(APP_MEETING_STATUSES.completed);
    expect(ended.meeting?.blocks?.[2]?.status).toBe(APP_MEETING_BLOCK_STATUSES.notRun);
  });
});
