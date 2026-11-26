import type { PrivateUptimeReport, PrivateUptimeWork, SiteHeartbeatReceipt, SiteHeartbeatReport } from "./admin-site-monitors.js";
import type { RequestOptions } from "./index.js";
/** The API origin plus the monitor's reportPath and token from its one-time credential. */
export type SiteMonitorDestination = {
    baseUrl: string;
    reportPath: string;
    writeToken: string;
    fetch?: typeof fetch;
};
/** Sends a job result and returns the first accepted receipt for that occurrence. */
export declare function submitSiteHeartbeat(destination: SiteMonitorDestination, report: SiteHeartbeatReport, options?: RequestOptions): Promise<SiteHeartbeatReceipt>;
/** Sends one private uptime observation. */
export declare function submitPrivateUptime(destination: SiteMonitorDestination, report: PrivateUptimeReport, options?: RequestOptions): Promise<void>;
/** Reads the check queued for the private probe; requestedAt is absent when nothing is pending. */
export declare function getPrivateUptimeWork(destination: SiteMonitorDestination, options?: RequestOptions): Promise<PrivateUptimeWork>;
