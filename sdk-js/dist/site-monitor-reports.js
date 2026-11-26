// Reports a domain's own monitors send with only the write credential that create or rotate returned:
// a scheduled job's heartbeat, and the private uptime probe's observations and pending work. They never
// carry a Custd client credential.
import { secureOrLocalUrl } from "./secure-url.js";
import { SDK_IDENTITY } from "./version.js";
const heartbeatReportPrefix = "/api/v1/site-heartbeat-reports/";
const privateUptimeReportPrefix = "/api/v1/site-private-uptime-reports/";
const maxReceiptBytes = 1024;
/** Sends a job result and returns the first accepted receipt for that occurrence. */
export async function submitSiteHeartbeat(destination, report, options) {
    const scheduledFor = Date.parse(report.scheduledFor);
    if (Number.isNaN(scheduledFor) || (report.outcome !== "succeeded" && report.outcome !== "failed")) {
        throw new Error("custd: heartbeat requires a scheduled time and succeeded or failed outcome");
    }
    const response = await sendMonitorRequest(destination, heartbeatReportPrefix, "POST", report, options);
    if (response.status !== 200)
        throw new Error(`custd: heartbeat report returned HTTP ${response.status}`);
    const receipt = await readBoundedJson(response, "heartbeat receipt");
    if (!receipt.receivedAt ||
        Date.parse(receipt.report?.scheduledFor ?? "") !== scheduledFor ||
        receipt.report.outcome !== report.outcome) {
        throw new Error("custd: heartbeat receipt does not match the submitted occurrence");
    }
    return receipt;
}
/** Sends one private uptime observation. */
export async function submitPrivateUptime(destination, report, options) {
    const response = await sendMonitorRequest(destination, privateUptimeReportPrefix, "POST", report, options);
    if (response.status !== 204)
        throw new Error(`custd: uptime report returned HTTP ${response.status}`);
}
/** Reads the check queued for the private probe; requestedAt is absent when nothing is pending. */
export async function getPrivateUptimeWork(destination, options) {
    const response = await sendMonitorRequest(destination, privateUptimeReportPrefix, "GET", undefined, options);
    if (response.status !== 200)
        throw new Error(`custd: uptime work returned HTTP ${response.status}`);
    return readBoundedJson(response, "uptime work");
}
async function sendMonitorRequest(destination, prefix, method, body, options) {
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
function monitorEndpoint(destination, prefix) {
    const base = secureOrLocalUrl(destination.baseUrl);
    if (base === undefined || base.pathname !== "/")
        throw new Error("custd: site monitor requires an HTTPS API origin");
    const [tenant, monitor, ...rest] = destination.reportPath.startsWith(prefix)
        ? destination.reportPath.slice(prefix.length).split("/")
        : [];
    if (rest.length > 0 ||
        !validMonitorSegment(tenant) ||
        !validMonitorSegment(monitor) ||
        destination.writeToken.length !== 64) {
        throw new Error("custd: site monitor requires a report path and write credential");
    }
    return `${base.origin}${destination.reportPath}`;
}
function validMonitorSegment(segment) {
    if (!segment)
        return false;
    let decoded;
    try {
        decoded = decodeURIComponent(segment);
    }
    catch {
        return false;
    }
    return decoded !== "" && decoded !== "." && decoded !== ".." && !/[/\\?#]/.test(decoded);
}
async function readBoundedJson(response, label) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxReceiptBytes) {
        throw new Error(`custd: ${label} exceeds ${maxReceiptBytes} bytes`);
    }
    return JSON.parse(text);
}
