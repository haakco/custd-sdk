import { describe, expect, it } from "vitest";
import { CustdClient } from "./index.js";

describe("data-label admin client", () => {
  it("maps vocabulary, value, assignment, and catalogue operations", async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = [];
    const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, path: `${url.pathname}${url.search}`, body });
      if (method === "GET" && url.pathname.endsWith("/data-labels")) {
        return Response.json({ definitions: [] });
      }
      if (method === "GET" && url.pathname.endsWith("/catalogue")) {
        return Response.json({ catalogue: { labels: [] }, assignments: [], reportingPacks: [], fingerprint: "sha256" });
      }
      if (method === "GET" && url.pathname.endsWith("/usage")) return Response.json({ usage: [] });
      if (method === "GET" && url.pathname.endsWith("/data-label-assignments")) {
        return Response.json({ eventTypeDefaults: [], schemaFieldAssignments: [] });
      }
      if (method === "GET") return Response.json({ uuid: "definition-1", values: [] });
      if (method === "POST" || method === "PATCH") {
        return body ? Response.json({ uuid: "resource-1", ...body }) : new Response(null, { status: 204 });
      }
      return new Response(null, { status: 204 });
    };
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch });
    const labels = client.admin.dataLabels;

    await labels.list(true);
    await labels.catalogue(true);
    await labels.get("definition/1", true);
    await labels.create({
      key: "app.plan",
      displayName: "Plan",
      description: "Plan",
      allowedScopes: ["event"],
      sensitivity: "internal",
      intendedUse: "Reporting",
      synonyms: [],
      propagationPolicy: "none",
    });
    await labels.update("definition/1", {
      displayName: "Plan",
      description: "Updated",
      allowedScopes: ["event"],
      sensitivity: "internal",
      intendedUse: "Reporting",
      synonyms: [],
      propagationPolicy: "none",
    });
    await labels.disable("definition/1");
    await labels.createValue("definition/1", { value: "paid", displayName: "Paid", description: "Paid" });
    await labels.updateValue("value/1", { displayName: "Paid", description: "Updated" });
    await labels.disableValue("value/1");
    await labels.listUsage();
    await labels.listAssignments();
    await labels.setEventTypeDefault("page/view", "definition/1", { valueUuid: "value-1" });
    await labels.removeEventTypeDefault("page/view", "definition/1");
    await labels.setSchemaFieldAssignment("schema/1", {
      fieldPath: "/user/id",
      definitionUuid: "definition-1",
      valueUuid: "value-1",
    });
    await labels.removeSchemaFieldAssignment("assignment/1");

    expect(calls.map(({ method, path }) => [method, path])).toEqual([
      ["GET", "/api/v1/admin/data-labels?includeDisabled=true"],
      ["GET", "/api/v1/admin/data-labels/catalogue?includeDisabled=true"],
      ["GET", "/api/v1/admin/data-labels/definition%2F1?includeDisabled=true"],
      ["POST", "/api/v1/admin/data-labels"],
      ["PATCH", "/api/v1/admin/data-labels/definition%2F1"],
      ["POST", "/api/v1/admin/data-labels/definition%2F1/disable"],
      ["POST", "/api/v1/admin/data-labels/definition%2F1/values"],
      ["PATCH", "/api/v1/admin/data-label-values/value%2F1"],
      ["POST", "/api/v1/admin/data-label-values/value%2F1/disable"],
      ["GET", "/api/v1/admin/data-labels/usage"],
      ["GET", "/api/v1/admin/data-label-assignments"],
      ["PUT", "/api/v1/admin/event-types/page%2Fview/data-label-defaults/definition%2F1"],
      ["DELETE", "/api/v1/admin/event-types/page%2Fview/data-label-defaults/definition%2F1"],
      ["PUT", "/api/v1/admin/event-schemas/schema%2F1/field-data-labels"],
      ["DELETE", "/api/v1/admin/data-label-assignments/schema-fields/assignment%2F1"],
    ]);
  });
});
