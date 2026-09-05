import { describe, expect, it, vi } from "vitest";
import { CustdClient, type TimePlanThresholdCue, validateTimePlanDefinition } from "./index";

describe("CustdClient time-plan admin", () => {
  it("serializes correction targets by transition UUID", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ transitionUuid: "correction-1" }), { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "admin-token" });

    await client.admin.timePlans.execute("acme", "run-1", {
      commandId: "command-1",
      idempotencyKey: "correction-1",
      expectedVersion: 1,
      type: "append_correction",
      supersedesTransitionUuid: "transition-1",
      corrected: { type: "complete_run", effectiveAt: "2026-09-02T12:01:00Z" },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.supersedesTransitionUuid).toBe("transition-1");
    expect(body.supersedesTransitionId).toBeUndefined();
  });

  it("uses tenant-scoped lifecycle, history, and annotation routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ plans: [{ uuid: "plan-1", planKey: "focus" }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ transitions: [{ uuid: "transition-1", type: "start_run" }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ uuid: "annotation-1", type: "note" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "admin-token" });

    const plans = await client.admin.timePlans.list("acme", 25);
    const history = await client.admin.timePlans.history("acme", "run-1", 10);
    const annotation = await client.admin.timePlans.createAnnotation("acme", "run-1", { type: "note", text: "hello" });
    await client.admin.timePlans.redactAnnotation("acme", "run-1", "annotation-1", { reason: "privacy request" });

    expect(plans.plans[0]?.uuid).toBe("plan-1");
    expect(history.transitions[0]?.type).toBe("start_run");
    expect(annotation.uuid).toBe("annotation-1");
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "http://localhost:8080/api/v1/admin/time-plans?companySlug=acme&limit=25",
      "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/history?companySlug=acme&limit=10",
      "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/annotations?companySlug=acme",
      "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/annotations/annotation-1/redact?companySlug=acme",
    ]);
  });

  it("validates typed threshold cues and allocation bases", () => {
    const definition = {
      horizonMs: 60_000,
      blocks: [
        {
          uuid: "block-1",
          semanticKey: "focus",
          title: "Focus",
          basis: "absolute" as const,
        },
      ],
    };

    expect(() =>
      validateTimePlanDefinition({
        ...definition,
        thresholdCues: [
          { remainingMs: 5_000, severity: "warning" },
          { remainingMs: 5_000, severity: "critical" },
        ],
      }),
    ).toThrow("duplicate triggers");
    expect(() =>
      validateTimePlanDefinition({
        ...definition,
        thresholdCues: [
          { remainingMs: 5_000, remainingFractionBps: 100, severity: "warning" } as unknown as TimePlanThresholdCue,
        ],
      }),
    ).toThrow("one remaining threshold");
    expect(() =>
      validateTimePlanDefinition({
        ...definition,
        thresholdCues: [{ remainingFractionBps: 10_001, severity: "warning" }],
      }),
    ).toThrow("out of range");
  });
});
