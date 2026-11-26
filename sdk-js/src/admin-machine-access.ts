/**
 * What a company's machine credentials (OAuth clients) may do, per feature area, for the whole
 * company and for each machine. The policy only narrows: an allowed area still needs the client's
 * own scopes, and a blocked area refuses that company's machines with a problem coded
 * `machine_access_blocked` whose `machineAccess` member names the setting.
 */

import type { RequestOptions } from "./index.js";

export const MACHINE_ACCESS_AREAS = {
  sites: "sites",
  reporting: "reporting",
  privacyErasure: "privacy_erasure",
  destructiveJobs: "destructive_jobs",
  usersAccess: "users_access",
  provisioning: "provisioning_credentials",
  ingestSchemas: "ingest_schemas",
  usageBilling: "usage_billing",
} as const;

export type MachineAccessArea = (typeof MACHINE_ACCESS_AREAS)[keyof typeof MACHINE_ACCESS_AREAS];

/** A company setting is allowed or blocked; a machine override may also inherit the company's. */
export const MACHINE_ACCESS_STATES = { allowed: "allowed", blocked: "blocked", inherit: "inherit" } as const;

export type MachineAccessState = (typeof MACHINE_ACCESS_STATES)[keyof typeof MACHINE_ACCESS_STATES];

/** The setting that decided an area, or that refused a request. */
export const MACHINE_ACCESS_DECIDED_BY = {
  company: "company",
  machine: "machine",
  /** The target company's "Allow Custd support automation" setting, for Custd's platform operator machine. */
  supportAutomation: "support_automation",
} as const;

export type MachineAccessDecidedBy = (typeof MACHINE_ACCESS_DECIDED_BY)[keyof typeof MACHINE_ACCESS_DECIDED_BY];

/** Problem codes of a machine access refusal; `unavailable` is a bounded retry, not a setting to change. */
export const MACHINE_ACCESS_PROBLEM_CODES = {
  blocked: "machine_access_blocked",
  unavailable: "machine_access_unavailable",
} as const;

/** The `machineAccess` member of a `machine_access_blocked` problem. */
export type MachineAccessBlock = {
  area: MachineAccessArea;
  blockedBy: MachineAccessDecidedBy;
  companySlug: string;
  clientId: string;
};

export type MachineAccessAreaSetting = { area: MachineAccessArea; state: MachineAccessState };

export type MachineAccessCompanyPolicy = {
  companySlug: string;
  allowSupportAutomation: boolean;
  areas: MachineAccessAreaSetting[];
};

/** Changes the settings it names and leaves the rest; each area is allowed or blocked. */
export type MachineAccessCompanyUpdateRequest = {
  allowSupportAutomation?: boolean;
  areas?: MachineAccessAreaSetting[];
};

export type MachineAccessMachinePolicy = {
  companySlug: string;
  clientId: string;
  areas: MachineAccessAreaSetting[];
};

/** Changes the areas it names for one machine; each is inherit, allowed or blocked. */
export type MachineAccessMachineUpdateRequest = { areas: MachineAccessAreaSetting[] };

export type MachineAccessEffectiveArea = {
  area: MachineAccessArea;
  allowed: boolean;
  decidedBy: MachineAccessDecidedBy;
  companyState: MachineAccessState;
  machineState: MachineAccessState;
};

/** One machine's effective access next to the scopes it was issued; an allowed area still needs its scope. */
export type MachineAccessEffective = {
  companySlug: string;
  clientId: string;
  scopes: string[];
  allowedAreas: number;
  totalAreas: number;
  areas: MachineAccessEffectiveArea[];
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class MachineAccessAdminClient {
  constructor(private readonly request: AdminRequester) {}

  /** A tenant administrator omits companySlug; platform authority names the company. */
  get(companySlug?: string, options?: RequestOptions): Promise<MachineAccessCompanyPolicy> {
    return this.request("GET", companyPath(companySlug), undefined, options);
  }

  update(
    body: MachineAccessCompanyUpdateRequest,
    companySlug?: string,
    options?: RequestOptions,
  ): Promise<MachineAccessCompanyPolicy> {
    return this.request("PUT", companyPath(companySlug), body, options);
  }

  /** The machine's own company is the scope. */
  getOverride(clientId: string, options?: RequestOptions): Promise<MachineAccessMachinePolicy> {
    return this.request("GET", clientPath(clientId), undefined, options);
  }

  updateOverride(
    clientId: string,
    body: MachineAccessMachineUpdateRequest,
    options?: RequestOptions,
  ): Promise<MachineAccessMachinePolicy> {
    return this.request("PUT", clientPath(clientId), body, options);
  }

  getEffective(clientId: string, options?: RequestOptions): Promise<MachineAccessEffective> {
    return this.request("GET", clientPath(clientId, "/effective"), undefined, options);
  }
}

function companyPath(companySlug?: string): string {
  return companySlug ? `/machine-access?companySlug=${encodeURIComponent(companySlug)}` : "/machine-access";
}

function clientPath(clientId: string, suffix = ""): string {
  return `/machine-access/clients/${encodeURIComponent(clientId)}${suffix}`;
}
