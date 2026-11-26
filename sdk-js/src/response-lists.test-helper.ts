// Builds the response list tables from the contract snapshot. scripts/generate-response-lists.ts writes
// them to response-lists.generated.ts, and response-lists.test.ts fails when that file is stale.
import { readFileSync } from "node:fs";
import type { ResponseListTable } from "./response-lists.ts";

type Operation = { id: string; method: string; path: string; sdk: string; example?: string };

export type ResponseListTables = { api: ResponseListTable; app: ResponseListTable; siteConfig: ResponseListTable };

const siteConfigPath = "/api/v1/sites/{siteUuid}/config";

// The browser clients get small tables of their own, so a page bundle never carries the API table.
function tableName(path: string): keyof ResponseListTables {
  if (path === siteConfigPath) return "siteConfig";
  return path.startsWith("/api/v1/app/") ? "app" : "api";
}

/** Every list field of each required operation's maximal example, the example that fills every field. */
export function buildResponseListTables(apiRoot: URL): ResponseListTables {
  const read = (path: string) => JSON.parse(readFileSync(new URL(path, apiRoot), "utf8"));
  const operations = (read("operations.json") as { operations: Operation[] }).operations;
  const tables: Record<keyof ResponseListTables, Record<string, string[]>> = { api: {}, app: {}, siteConfig: {} };
  for (const operation of operations) {
    if (operation.sdk !== "required" || !operation.example) continue;
    const fields = listFields((read(operation.example) as { maximal: unknown }).maximal, "");
    if (fields.length === 0) continue;
    const key = `${operation.method} ${operation.path}`;
    const table = tables[tableName(operation.path)];
    table[key] = [...new Set([...(table[key] ?? []), ...fields])].sort();
  }
  return { api: sortKeys(tables.api), app: sortKeys(tables.app), siteConfig: sortKeys(tables.siteConfig) };
}

function listFields(value: unknown, path: string): string[] {
  if (Array.isArray(value)) return [path || "[]", ...listFields(value[0], `${path}[]`)];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => listFields(child, path ? `${path}.${key}` : key));
}

function sortKeys(table: Record<string, string[]>): ResponseListTable {
  return Object.fromEntries(Object.entries(table).sort(([left], [right]) => left.localeCompare(right)));
}
