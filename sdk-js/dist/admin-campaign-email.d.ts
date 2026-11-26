/**
 * Campaign email: published revisions and their rendering, scheduled runs, recipient permission, and
 * the welcome journey (welcome then reminder) driven by confirmed signups and activations.
 */
import type { CampaignEmailSelection } from "./admin-email-relay.js";
import type { RequestOptions } from "./index.js";
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
/** A published, immutable campaign revision. artifactJson is the campaign artifact as text. */
export type CampaignEmailRevision = {
    revision: string;
    artifactJson: string;
    publishedAt: string;
};
export type CampaignEmailRevisionPublishRequest = {
    revision: string;
    artifactJson: string;
};
export type CampaignEmailRenderRequest = {
    slots: Record<string, string>;
};
export type CampaignEmailRenderResult = {
    companyUuid: string;
    subject: string;
    html: string;
    text: string;
};
export type CampaignEmailRunScheduleRequest = {
    /** The caller-chosen run UUID, so a retried schedule is the same run. */
    id: string;
    campaign: CampaignEmailSelection;
    recipients: string[];
    scheduledAt: string;
    audienceDigest?: string;
};
export type CampaignEmailRunRecipientStatus = {
    position: number;
    state: string;
    deliveryUuid?: string;
    reason?: string;
};
export type CampaignEmailRunStatus = {
    id: string;
    revision: string;
    scheduledAt: string;
    cancelledAt?: string;
    recipients: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    excluded: number;
    cancelled: number;
    deliveries: CampaignEmailRunRecipientStatus[];
};
export type CampaignEmailRecipient = {
    email: string;
};
export type CampaignEmailConfirmation = {
    email: string;
    confirmedAt: string;
    source: string;
    evidenceRef: string;
};
export type CampaignEmailPermission = {
    eligible: boolean;
    confirmedAt?: string;
    withdrawnAt?: string;
};
export type CampaignWelcomeDefinition = {
    version: string;
    welcome: CampaignEmailSelection;
    reminder: CampaignEmailSelection;
};
/** Pauses the welcome journey when true and resumes it when false. */
export type CampaignWelcomePause = {
    paused: boolean;
};
export type CampaignWelcomeState = {
    version: string;
    paused: boolean;
};
export type CampaignWelcomeSignup = {
    contactId: string;
    email: string;
    confirmedAt: string;
    evidenceRef: string;
    evidenceSource: string;
};
export type CampaignWelcomeActivation = {
    contactId: string;
    activatedAt: string;
};
export type CampaignWelcomeEnrollment = {
    contactId: string;
    version?: string;
    welcomeRunId?: string;
    reminderRunId?: string;
    earliestReminderAt?: string;
    activatedAt?: string;
};
export declare class CampaignEmailAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    createRevision(body: CampaignEmailRevisionPublishRequest, companySlug?: string): Promise<CampaignEmailRevision>;
    getRevision(revision: string, companySlug?: string): Promise<CampaignEmailRevision>;
    renderRevision(revision: string, body: CampaignEmailRenderRequest): Promise<CampaignEmailRenderResult>;
    startRun(body: CampaignEmailRunScheduleRequest, companySlug?: string): Promise<CampaignEmailRunStatus>;
    getRun(runId: string, companySlug?: string): Promise<CampaignEmailRunStatus>;
    cancelRun(runId: string, companySlug?: string): Promise<CampaignEmailRunStatus>;
    checkPermission(body: CampaignEmailRecipient, companySlug?: string): Promise<CampaignEmailPermission>;
    confirmPermission(body: CampaignEmailConfirmation, companySlug?: string): Promise<CampaignEmailPermission>;
    withdrawPermission(body: CampaignEmailRecipient, companySlug?: string): Promise<CampaignEmailPermission>;
    putWelcomeDefinition(body: CampaignWelcomeDefinition, companySlug?: string): Promise<CampaignWelcomeState>;
    setWelcomePaused(body: CampaignWelcomePause, companySlug?: string): Promise<CampaignWelcomeState>;
    recordWelcomeConfirmedSignup(body: CampaignWelcomeSignup, companySlug?: string): Promise<CampaignWelcomeEnrollment>;
    recordWelcomeActivation(body: CampaignWelcomeActivation, companySlug?: string): Promise<CampaignWelcomeEnrollment>;
    getWelcomeContact(contactId: string, companySlug?: string): Promise<CampaignWelcomeEnrollment>;
    private run;
}
export {};
