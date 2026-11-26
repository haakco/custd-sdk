/**
 * Notification webhooks and their deliveries. A subscription posts signed notifications to an HTTPS
 * endpoint or a Slack incoming webhook; its signing secret is shown only on create and rotate.
 */

import type { RequestOptions } from "./index.js";

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export type NotificationWebhookKind = "webhook" | "slack";

export type NotificationWebhookSubscription = {
  uuid: string;
  name: string;
  kind: NotificationWebhookKind;
  endpoint: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

/** A subscription plus its signing secret, returned only when the secret is created or rotated. */
export type NotificationWebhookSecret = NotificationWebhookSubscription & { signingSecret: string };

export type NotificationWebhookListResponse = { subscriptions: NotificationWebhookSubscription[] };

export type NotificationWebhookCreateRequest = {
  companySlug: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  kind?: NotificationWebhookKind;
};

/** One notification delivery's current state. */
export type NotificationDeliveryStatus = {
  messageUuid: string;
  deliveryUuid: string;
  templateId: string;
  channel: string;
  state: string;
  attemptCount: number;
  failureReason?: string;
  lastErrorClass?: string;
  nextAction?: string;
  providerMessageId?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  terminalAt?: string;
};

/** Why an operator replays a delivery; it lands in the audit stream. At most 255 characters. */
export type NotificationDeliveryReplayRequest = { reason: string };

const webhooksPath = "/notification-webhooks";

export class NotificationWebhookAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async list(companySlug?: string): Promise<NotificationWebhookListResponse> {
    const response = await this.request<{ subscriptions: NotificationWebhookSubscription[] | null }>(
      "GET",
      withCompany(webhooksPath, companySlug),
    );
    return { subscriptions: response.subscriptions ?? [] };
  }

  create(body: NotificationWebhookCreateRequest): Promise<NotificationWebhookSecret> {
    return this.request("POST", webhooksPath, body);
  }

  setEnabled(uuid: string, enabled: boolean, companySlug?: string): Promise<NotificationWebhookSubscription> {
    return this.request("PATCH", withCompany(webhookPath(uuid), companySlug), { enabled });
  }

  rotateSecret(uuid: string, companySlug?: string): Promise<NotificationWebhookSecret> {
    return this.request("POST", withCompany(`${webhookPath(uuid)}/rotate-secret`, companySlug));
  }

  delete(uuid: string, companySlug?: string): Promise<void> {
    return this.request("DELETE", withCompany(webhookPath(uuid), companySlug));
  }

  getDelivery(deliveryUuid: string, companySlug?: string): Promise<NotificationDeliveryStatus> {
    return this.request("GET", withCompany(deliveryPath(deliveryUuid), companySlug));
  }

  /** Queues the delivery again. */
  replay(deliveryUuid: string, body: NotificationDeliveryReplayRequest, companySlug?: string): Promise<void> {
    return this.request("POST", withCompany(`${deliveryPath(deliveryUuid)}/replay`, companySlug), body);
  }
}

function webhookPath(uuid: string): string {
  return `${webhooksPath}/${encodeURIComponent(uuid)}`;
}

function deliveryPath(uuid: string): string {
  return `/notification-deliveries/${encodeURIComponent(uuid)}`;
}

function withCompany(path: string, companySlug?: string): string {
  return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
