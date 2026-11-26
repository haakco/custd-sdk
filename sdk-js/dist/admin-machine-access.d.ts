/**
 * What a company's machine credentials (OAuth clients) may do, per feature area, for the whole
 * company and for each machine. The policy only narrows: an allowed area still needs the client's
 * own scopes, and a blocked area refuses that company's machines with a problem coded
 * `machine_access_blocked` whose `machineAccess` member names the setting.
 */
import type { RequestOptions } from "./index.js";
export declare const MACHINE_ACCESS_AREAS: {
    readonly sites: "sites";
    readonly reporting: "reporting";
    readonly privacyErasure: "privacy_erasure";
    readonly destructiveJobs: "destructive_jobs";
    readonly usersAccess: "users_access";
    readonly provisioning: "provisioning_credentials";
    readonly ingestSchemas: "ingest_schemas";
    readonly usageBilling: "usage_billing";
};
export type MachineAccessArea = (typeof MACHINE_ACCESS_AREAS)[keyof typeof MACHINE_ACCESS_AREAS];
/** A company setting is allowed or blocked; a machine override may also inherit the company's. */
export declare const MACHINE_ACCESS_STATES: {
    readonly allowed: "allowed";
    readonly blocked: "blocked";
    readonly inherit: "inherit";
};
export type MachineAccessState = (typeof MACHINE_ACCESS_STATES)[keyof typeof MACHINE_ACCESS_STATES];
/** The setting that decided an area, or that refused a request. */
export declare const MACHINE_ACCESS_DECIDED_BY: {
    readonly company: "company";
    readonly machine: "machine";
    /** The target company's "Allow Custd support automation" setting, for Custd's platform operator machine. */
    readonly supportAutomation: "support_automation";
};
export type MachineAccessDecidedBy = (typeof MACHINE_ACCESS_DECIDED_BY)[keyof typeof MACHINE_ACCESS_DECIDED_BY];
/** Problem codes of a machine access refusal; `unavailable` is a bounded retry, not a setting to change. */
export declare const MACHINE_ACCESS_PROBLEM_CODES: {
    readonly blocked: "machine_access_blocked";
    readonly unavailable: "machine_access_unavailable";
};
/** The `machineAccess` member of a `machine_access_blocked` problem. */
export type MachineAccessBlock = {
    area: MachineAccessArea;
    blockedBy: MachineAccessDecidedBy;
    companySlug: string;
    clientId: string;
};
export type MachineAccessAreaSetting = {
    area: MachineAccessArea;
    state: MachineAccessState;
};
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
export type MachineAccessMachineUpdateRequest = {
    areas: MachineAccessAreaSetting[];
};
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
export declare class MachineAccessAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    /** A tenant administrator omits companySlug; platform authority names the company. */
    get(companySlug?: string, options?: RequestOptions): Promise<MachineAccessCompanyPolicy>;
    update(body: MachineAccessCompanyUpdateRequest, companySlug?: string, options?: RequestOptions): Promise<MachineAccessCompanyPolicy>;
    /** The machine's own company is the scope. */
    getOverride(clientId: string, options?: RequestOptions): Promise<MachineAccessMachinePolicy>;
    updateOverride(clientId: string, body: MachineAccessMachineUpdateRequest, options?: RequestOptions): Promise<MachineAccessMachinePolicy>;
    getEffective(clientId: string, options?: RequestOptions): Promise<MachineAccessEffective>;
}
export {};
