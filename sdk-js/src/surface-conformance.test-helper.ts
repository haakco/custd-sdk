// Shared shapes for the route conformance table. Each area keeps its rows in its own
// surface-rows-<area>.test-helper.ts module; surface-conformance.test.ts runs them all and owns
// the coverage equality check.
import type { AppItemsClient, CurrentAppProfileClient, ErrorCaptureClient } from "./browser";
import type { CustdClient } from "./index";

export type Clients = {
  custd: CustdClient;
  items: AppItemsClient;
  profile: CurrentAppProfileClient;
  errors: ErrorCaptureClient;
  fetch: typeof fetch;
};

export type Row = {
  id: string;
  /** The method the SDK sends, stated only for an ANY operation. */
  method?: string;
  /** Sample values for the operation's {path} parameters. */
  params?: Record<string, string>;
  /** Query parameters the SDK must send, such as the optional companySlug the row passes. */
  query?: Record<string, string>;
  call: (c: Clients) => unknown;
  /** A response other than the operation's maximal example, for downloads and binary reads. */
  response?: () => Response;
};

/** An area's rows plus the operations whose SDK method decodes (validates or reshapes) the response. */
export type RowArea = {
  rows: Row[];
  /** Decoded operations proven against both the minimal and the maximal example. */
  decoded: string[];
};

/** A request body whose fields the route does not depend on. */
export function dto<T>(value: object = {}): T {
  return value as T;
}

/** Every optional usage query parameter, so a usage row proves it sends them all. */
export const usageWindow = {
  meterSlug: "events",
  start: "2026-11-01T00:00:00Z",
  end: "2026-11-20T00:00:00Z",
  limit: 10,
};

/** Every optional audit filter, so an audit row proves it sends them all. */
export const auditFilter = {
  scope: "tenant",
  companySlug: "acme",
  affectedTenantSlug: "tenant-1",
  since: "2026-11-01T00:00:00Z",
  until: "2026-11-20T00:00:00Z",
  actorKind: "user",
  actorReference: "actor-1",
  action: "site_domain.create",
  resourceType: "site_domain",
  resourceId: "resource-1",
  outcome: "success",
  correlationId: "correlation-1",
  environmentId: "environment-1",
  limit: 10,
  cursor: "cursor-1",
} as const;
