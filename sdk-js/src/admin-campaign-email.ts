/**
 * Campaign email: published revisions and their rendering, scheduled runs, recipient permission, and
 * the welcome journey (welcome then reminder) driven by confirmed signups and activations.
 */

import type { CampaignEmailSelection } from "./admin-email-relay.js";
import type { RequestOptions } from "./index.js";

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

/** A published, immutable campaign revision. artifactJson is the campaign artifact as text. */
export type CampaignEmailRevision = { revision: string; artifactJson: string; publishedAt: string };

export type CampaignEmailRevisionPublishRequest = { revision: string; artifactJson: string };

export type CampaignEmailRenderRequest = { slots: Record<string, string> };

export type CampaignEmailRenderResult = { companyUuid: string; subject: string; html: string; text: string };

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

export type CampaignEmailRecipient = { email: string };

export type CampaignEmailConfirmation = {
  email: string;
  confirmedAt: string;
  source: string;
  evidenceRef: string;
};

export type CampaignEmailPermission = { eligible: boolean; confirmedAt?: string; withdrawnAt?: string };

export type CampaignWelcomeDefinition = {
  version: string;
  welcome: CampaignEmailSelection;
  reminder: CampaignEmailSelection;
};

/** Pauses the welcome journey when true and resumes it when false. */
export type CampaignWelcomePause = { paused: boolean };

export type CampaignWelcomeState = { version: string; paused: boolean };

export type CampaignWelcomeSignup = {
  contactId: string;
  email: string;
  confirmedAt: string;
  evidenceRef: string;
  evidenceSource: string;
};

export type CampaignWelcomeActivation = { contactId: string; activatedAt: string };

export type CampaignWelcomeEnrollment = {
  contactId: string;
  version?: string;
  welcomeRunId?: string;
  reminderRunId?: string;
  earliestReminderAt?: string;
  activatedAt?: string;
};

type WireRunStatus = Omit<CampaignEmailRunStatus, "deliveries"> & {
  deliveries: CampaignEmailRunRecipientStatus[] | null;
};

export class CampaignEmailAdminClient {
  constructor(private readonly request: AdminRequester) {}

  createRevision(body: CampaignEmailRevisionPublishRequest, companySlug?: string): Promise<CampaignEmailRevision> {
    return this.request("POST", scoped("/campaign-email-revisions", companySlug), body);
  }

  getRevision(revision: string, companySlug?: string): Promise<CampaignEmailRevision> {
    return this.request("GET", scoped(revisionPath(revision), companySlug));
  }

  renderRevision(revision: string, body: CampaignEmailRenderRequest): Promise<CampaignEmailRenderResult> {
    return this.request("POST", `${revisionPath(revision)}/render`, body);
  }

  previewRevision(
    revision: string,
    body: CampaignEmailRenderRequest,
    companySlug?: string,
  ): Promise<CampaignEmailRenderResult> {
    return this.request("POST", scoped(`${revisionPath(revision)}/preview`, companySlug), body);
  }

  startRun(body: CampaignEmailRunScheduleRequest, companySlug?: string): Promise<CampaignEmailRunStatus> {
    return this.run("POST", "/campaign-email-runs", companySlug, body);
  }

  getRun(runId: string, companySlug?: string): Promise<CampaignEmailRunStatus> {
    return this.run("GET", runPath(runId), companySlug);
  }

  cancelRun(runId: string, companySlug?: string): Promise<CampaignEmailRunStatus> {
    return this.run("POST", `${runPath(runId)}/cancel`, companySlug);
  }

  checkPermission(body: CampaignEmailRecipient, companySlug?: string): Promise<CampaignEmailPermission> {
    return this.request("POST", scoped("/campaign-email-permissions/check", companySlug), body);
  }

  confirmPermission(body: CampaignEmailConfirmation, companySlug?: string): Promise<CampaignEmailPermission> {
    return this.request("POST", scoped("/campaign-email-permissions/confirm", companySlug), body);
  }

  withdrawPermission(body: CampaignEmailRecipient, companySlug?: string): Promise<CampaignEmailPermission> {
    return this.request("POST", scoped("/campaign-email-permissions/withdraw", companySlug), body);
  }

  putWelcomeDefinition(body: CampaignWelcomeDefinition, companySlug?: string): Promise<CampaignWelcomeState> {
    return this.request("PUT", scoped("/campaign-email-welcome/definition", companySlug), body);
  }

  setWelcomePaused(body: CampaignWelcomePause, companySlug?: string): Promise<CampaignWelcomeState> {
    return this.request("PUT", scoped("/campaign-email-welcome/pause", companySlug), body);
  }

  recordWelcomeConfirmedSignup(body: CampaignWelcomeSignup, companySlug?: string): Promise<CampaignWelcomeEnrollment> {
    return this.request("POST", scoped("/campaign-email-welcome/confirmed-signup", companySlug), body);
  }

  recordWelcomeActivation(body: CampaignWelcomeActivation, companySlug?: string): Promise<CampaignWelcomeEnrollment> {
    return this.request("POST", scoped("/campaign-email-welcome/activation", companySlug), body);
  }

  getWelcomeContact(contactId: string, companySlug?: string): Promise<CampaignWelcomeEnrollment> {
    return this.request(
      "GET",
      scoped(`/campaign-email-welcome/contacts/${encodeURIComponent(contactId)}`, companySlug),
    );
  }

  private async run(
    method: string,
    path: string,
    companySlug: string | undefined,
    body?: CampaignEmailRunScheduleRequest,
  ): Promise<CampaignEmailRunStatus> {
    const status = await this.request<WireRunStatus>(method, scoped(path, companySlug), body);
    return { ...status, deliveries: status.deliveries ?? [] };
  }
}

function revisionPath(revision: string): string {
  return `/campaign-email-revisions/${encodeURIComponent(revision)}`;
}

function runPath(runId: string): string {
  return `/campaign-email-runs/${encodeURIComponent(runId)}`;
}

function scoped(path: string, companySlug?: string): string {
  return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
