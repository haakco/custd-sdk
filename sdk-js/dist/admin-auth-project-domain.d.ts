import type { AppItemKind, AppLinkRole } from "./app-items.js";
/** Where an environment's authentication hostname is in its activation. */
export declare const AUTH_PROJECT_DOMAIN_STATUSES: {
    readonly pending: "pending";
    readonly active: "active";
    readonly proofWithdrawn: "proof-withdrawn";
    readonly disabled: "disabled";
    readonly releasing: "releasing";
};
export type AuthProjectDomainStatus = (typeof AUTH_PROJECT_DOMAIN_STATUSES)[keyof typeof AUTH_PROJECT_DOMAIN_STATUSES];
/** Whether the realm holds installed capacity. */
export declare const AUTH_PROJECT_DOMAIN_LIFECYCLES: {
    readonly unclaimed: "unclaimed";
    readonly admitted: "admitted";
    readonly paused: "paused";
    readonly retiring: "retiring";
    readonly retired: "retired";
};
export type AuthProjectDomainLifecycle = (typeof AUTH_PROJECT_DOMAIN_LIFECYCLES)[keyof typeof AUTH_PROJECT_DOMAIN_LIFECYCLES];
/** Whether the realm runs the images it is expected to. */
export declare const AUTH_PROJECT_DOMAIN_CONVERGENCES: {
    readonly converged: "converged";
    readonly drifted: "drifted";
    readonly notRunning: "not-running";
    readonly unverified: "unverified";
    readonly rollingOut: "rolling-out";
};
export type AuthProjectDomainConvergence = (typeof AUTH_PROJECT_DOMAIN_CONVERGENCES)[keyof typeof AUTH_PROJECT_DOMAIN_CONVERGENCES];
/** Where the realm's expected image identity comes from. */
export declare const AUTH_PROJECT_DOMAIN_IMAGE_SOURCES: {
    readonly releaseDefault: "release-default";
    readonly override: "override";
    readonly undeclared: "undeclared";
};
export type AuthProjectDomainImageSource = (typeof AUTH_PROJECT_DOMAIN_IMAGE_SOURCES)[keyof typeof AUTH_PROJECT_DOMAIN_IMAGE_SOURCES];
/** The realm workload an incident image override pins. */
export declare const AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS: {
    readonly gateway: "gateway";
    readonly hydra: "hydra";
};
export type AuthProjectDomainImageComponent = (typeof AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS)[keyof typeof AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS];
/** Reserve a verified Site domain's hostname for the environment. */
export type AuthProjectDomainBindRequest = {
    siteDomainId: string;
    host: string;
};
/** Reserve a platform-generated issuer hostname, attested by a Site domain. Operators only. */
export type AuthProjectDomainMintRequest = {
    siteDomainId: string;
};
/** Pin one realm component to an exact image until expiresAt, for an incident. */
export type AuthProjectDomainImageOverrideRequest = {
    component: AuthProjectDomainImageComponent;
    imageDigest: string;
    incidentReference: string;
    expiresAt: string;
};
export type AuthProjectDomainImageSet = {
    gateway?: string;
    hydra?: string;
};
/** The realm's active or last incident image override. */
export type AuthProjectDomainImageOverride = {
    component: AuthProjectDomainImageComponent;
    imageDigest: string;
    incidentReference: string;
    actorKind: string;
    actorSubject?: string;
    receiptId: string;
    state: string;
    setAt: string;
    expiresAt: string;
    endedAt?: string;
    endedBy?: string;
};
export type AuthProjectDomainImages = {
    expected: AuthProjectDomainImageSet;
    running: AuthProjectDomainImageSet;
    source: AuthProjectDomainImageSource;
    convergence: AuthProjectDomainConvergence;
    override?: AuthProjectDomainImageOverride;
};
/** The TXT record that proves the hostname. */
export type AuthProjectDomainDNSProof = {
    recordName: string;
    recordValue: string;
};
/** An environment's authentication hostname, its state and the DNS records it needs. */
export type AuthProjectDomainBinding = {
    environmentId: string;
    slotRef?: string;
    siteDomainId?: string;
    host: string;
    issuer: string;
    status: AuthProjectDomainStatus;
    lifecycle: AuthProjectDomainLifecycle;
    intentRevision: number;
    images: AuthProjectDomainImages;
    dnsTarget?: string;
    dnsProof?: AuthProjectDomainDNSProof;
    createdAt: string;
    observedAt?: string;
    certificateExpiresAt?: string;
};
/** The realm's stored brand logo. */
export type AuthProjectBrandLogo = {
    contentType: string;
    updatedAt: string;
    byteSize: number;
    width: number;
    height: number;
};
/** One owner or share link to an app item in the environment. */
export type AuthProjectAppLink = {
    linkUuid: string;
    itemUuid: string;
    kind: AppItemKind;
    role: AppLinkRole;
    createdAt: string;
    /** When the item expires unless it changes; its links stop working then. */
    itemExpiresAt: string;
};
export type AuthProjectAppLinkList = {
    links: AuthProjectAppLink[];
};
