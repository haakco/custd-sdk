// Reports a domain's own monitors send with only the write credential that create or rotate returned:
// a scheduled job's heartbeat, and the private uptime probe's observations and pending work. They never
// carry a Custd client credential.

import type {
  PrivateUptimeReport,
  PrivateUptimeWork,
  SiteHeartbeatReceipt,
  SiteHeartbeatReport,
} from "./admin-site-monitors.js";
import type { RequestOptions } from "./index.js";
import { secureOrLocalUrl } from "./secure-url.js";
import { SDK_IDENTITY } from "./version.js";

/** The API origin plus the monitor's reportPath and token from its one-time credential. */
export type SiteMonitorDestination = {
  baseUrl: string;
  reportPath: string;
  writeToken: string;
  fetch?: typeof fetch;
};

const heartbeatReportPrefix = "/api/v1/site-heartbeat-reports/";
const privateUptimeReportPrefix = "/api/v1/site-private-uptime-reports/";
const maxReceiptBytes = 1024;

/** Sends a job result and returns the first accepted receipt for that occurrence. */
export async function submitSiteHeartbeat(
  destination: SiteMonitorDestination,
  report: SiteHeartbeatReport,
  options?: RequestOptions,
): Promise<SiteHeartbeatReceipt> {
  const scheduledFor = Date.parse(report.scheduledFor);
  if (Number.isNaN(scheduledFor) || (report.outcome !== "succeeded" && report.outcome !== "failed")) {
    throw new Error("custd: heartbeat requires a scheduled time and succeeded or failed outcome");
  }
  const response = await sendMonitorRequest(destination, heartbeatReportPrefix, "POST", report, options);
  if (response.status !== 200) throw new Error(`custd: heartbeat report returned HTTP ${response.status}`);
  const receipt = await readBoundedJson<SiteHeartbeatReceipt>(response, "heartbeat receipt");
  if (
    !receipt.receivedAt ||
    Date.parse(receipt.report?.scheduledFor ?? "") !== scheduledFor ||
    receipt.report.outcome !== report.outcome
  ) {
    throw new Error("custd: heartbeat receipt does not match the submitted occurrence");
  }
  return receipt;
}

/** Sends one private uptime observation. */
export async function submitPrivateUptime(
  destination: SiteMonitorDestination,
  report: PrivateUptimeReport,
  options?: RequestOptions,
): Promise<void> {
  const response = await sendMonitorRequest(destination, privateUptimeReportPrefix, "POST", report, options);
  if (response.status !== 204) throw new Error(`custd: uptime report returned HTTP ${response.status}`);
}

/** Reads the check queued for the private probe; requestedAt is absent when nothing is pending. */
export async function getPrivateUptimeWork(
  destination: SiteMonitorDestination,
  options?: RequestOptions,
): Promise<PrivateUptimeWork> {
  const response = await sendMonitorRequest(destination, privateUptimeReportPrefix, "GET", undefined, options);
  if (response.status !== 200) throw new Error(`custd: uptime work returned HTTP ${response.status}`);
  return readBoundedJson<PrivateUptimeWork>(response, "uptime work");
}

async function sendMonitorRequest(
  destination: SiteMonitorDestination,
  prefix: string,
  method: "GET" | "POST",
  body: unknown,
  options?: RequestOptions,
): Promise<Response> {
  const endpoint = monitorEndpoint(destination, prefix);
  const fetchImpl = destination.fetch ?? fetch;
  return fetchImpl(endpoint, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${destination.writeToken}`,
      "X-Custd-Sdk": SDK_IDENTITY,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
    signal: options?.signal,
  });
}

function monitorEndpoint(destination: SiteMonitorDestination, prefix: string): string {
  const base = secureOrLocalUrl(destination.baseUrl);
  if (base === undefined || base.pathname !== "/") throw new Error("custd: site monitor requires an HTTPS API origin");
  const [tenant, monitor, ...rest] = destination.reportPath.startsWith(prefix)
    ? destination.reportPath.slice(prefix.length).split("/")
    : [];
  if (
    rest.length > 0 ||
    !validMonitorSegment(tenant) ||
    !validMonitorSegment(monitor) ||
    destination.writeToken.length !== 64
  ) {
    throw new Error("custd: site monitor requires a report path and write credential");
  }
  return `${base.origin}${destination.reportPath}`;
}

function validMonitorSegment(segment: string | undefined): boolean {
  if (!segment) return false;
  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return false;
  }
  return decoded !== "" && decoded !== "." && decoded !== ".." && !/[/\\?#]/.test(decoded);
}

async function readBoundedJson<T>(response: Response, label: string): Promise<T> {
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maxReceiptBytes) {
    throw new Error(`custd: ${label} exceeds ${maxReceiptBytes} bytes`);
  }
  return JSON.parse(text) as T;
}
