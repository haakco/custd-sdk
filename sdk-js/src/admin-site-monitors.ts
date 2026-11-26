// A domain's own monitors beside the public uptime check: scheduled-job heartbeats, a private
// uptime probe inside the customer's network, and maintenance windows that pause alerting.
// SiteDomainAdminClient sends the calls.

/** When a scheduled job must report: a five-field cron in an IANA timezone, plus a grace period. */
export type SiteHeartbeatSchedule = {
  cron: string;
  timezone: string;
  graceMinutes: number;
};

/** A new heartbeat monitor. */
export type SiteHeartbeatCreateRequest = {
  name: string;
  schedule: SiteHeartbeatSchedule;
};

export const SITE_HEARTBEAT_OUTCOMES = {
  succeeded: "succeeded",
  failed: "failed",
} as const;

export type SiteHeartbeatOutcome = (typeof SITE_HEARTBEAT_OUTCOMES)[keyof typeof SITE_HEARTBEAT_OUTCOMES];

export const SITE_HEARTBEAT_STATUSES = {
  pending: "pending",
  onTime: "on-time",
  late: "late",
  missed: "missed",
  failed: "failed",
} as const;

export type SiteHeartbeatStatus = (typeof SITE_HEARTBEAT_STATUSES)[keyof typeof SITE_HEARTBEAT_STATUSES];

/** The scheduled occurrence a job reported and how it ended. */
export type SiteHeartbeatReport = {
  scheduledFor: string;
  outcome: SiteHeartbeatOutcome;
};

/** The first accepted report for an occurrence. */
export type SiteHeartbeatReceipt = {
  report: SiteHeartbeatReport;
  receivedAt: string;
};

/** A heartbeat monitor and its latest observed state. latest is absent before the first report. */
export type SiteHeartbeatMonitor = {
  monitorUuid: string;
  name: string;
  schedule: SiteHeartbeatSchedule;
  startedAt: string;
  latest?: SiteHeartbeatReceipt;
  nextExpectedAt: string;
  status: SiteHeartbeatStatus;
};

/** The one-time write credential returned by create or rotate. Copy the token now; it is never shown again. */
export type SiteHeartbeatCredential = {
  monitor: SiteHeartbeatMonitor;
  token: string;
  reportPath: string;
};

/** A domain's heartbeat monitors, without their tokens. */
export type SiteHeartbeatList = {
  monitors: SiteHeartbeatMonitor[];
};

export const PRIVATE_UPTIME_STATUSES = {
  unknown: "unknown",
  up: "up",
  down: "down",
} as const;

export type PrivateUptimeStatus = (typeof PRIVATE_UPTIME_STATUSES)[keyof typeof PRIVATE_UPTIME_STATUSES];

export const PRIVATE_UPTIME_FAILURES = {
  dns: "dns",
  connection: "connection",
  tls: "tls",
  timeout: "timeout",
} as const;

export type PrivateUptimeFailure = (typeof PRIVATE_UPTIME_FAILURES)[keyof typeof PRIVATE_UPTIME_FAILURES];

/** One observation from the probe inside the monitored network. */
export type PrivateUptimeReport = {
  reportUuid: string;
  observedAt: string;
  statusCode?: number;
  responseMs: number;
  failure?: PrivateUptimeFailure;
};

/** The private probe, its latest observation and any pending check request. */
export type PrivateUptimeMonitor = {
  monitorUuid: string;
  networkLabel: string;
  latest?: PrivateUptimeReport;
  requestedAt?: string;
  status: PrivateUptimeStatus;
};

/** The one-time write credential returned by create or rotate. Copy the token now; it is never shown again. */
export type PrivateUptimeCredential = {
  monitor: PrivateUptimeMonitor;
  reportPath: string;
  token: string;
};

/** The check queued for the private probe; requestedAt is absent when nothing is pending. */
export type PrivateUptimeWork = {
  requestedAt?: string;
};

/** A one-off maintenance window. Reuse windowUuid when retrying the same request. */
export type SiteMaintenanceWindowRequest = {
  windowUuid: string;
  startsAt: string;
  endsAt: string;
};

/** A scheduled or historical maintenance window. cancelledAt is set once it was cancelled. */
export type SiteMaintenanceWindow = {
  windowUuid: string;
  startsAt: string;
  endsAt: string;
  cancelledAt?: string;
};

/** A domain's current and historical maintenance windows. */
export type SiteMaintenanceWindows = {
  windows: SiteMaintenanceWindow[];
};
