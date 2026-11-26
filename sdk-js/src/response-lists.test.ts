import { describe, expect, it } from "vitest";
import { responseListNormaliser } from "./response-lists";
import { API_RESPONSE_LISTS, APP_RESPONSE_LISTS, SITE_CONFIG_RESPONSE_LISTS } from "./response-lists.generated";
import { buildResponseListTables } from "./response-lists.test-helper";

describe("response list tables", () => {
  it("match the contract snapshot; regenerate with pnpm -C sdk-js run generate:response-lists", () => {
    const tables = buildResponseListTables(new URL("../../contract-fixtures/api/", import.meta.url));
    expect(API_RESPONSE_LISTS).toEqual(tables.api);
    expect(APP_RESPONSE_LISTS).toEqual(tables.app);
    expect(SITE_CONFIG_RESPONSE_LISTS).toEqual(tables.siteConfig);
  });

  it("empties only listed null lists, inside list items too, and prefers a literal route", () => {
    const normalise = responseListNormaliser({
      "GET /api/v1/things/{uuid}": ["items", "items[].tags"],
      "GET /api/v1/things/special": ["other"],
    });
    const body = { items: [{ tags: null, note: null }], label: null };
    expect(normalise("GET", "/api/v1/things/thing-1?limit=5", body)).toEqual({
      items: [{ tags: [], note: null }],
      label: null,
    });
    expect(normalise("GET", "/api/v1/things/special", { items: null, other: null })).toEqual({
      items: null,
      other: [],
    });
    expect(normalise("POST", "/api/v1/things/thing-1", { items: null })).toEqual({ items: null });
  });
});
