/**
 * Where each tenant notification event is delivered: by email to one recipient, or to the tenant's
 * webhook or Slack subscriptions.
 */

import type { RequestOptions } from "./index.js";

type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

/** The notification events a tenant routes itself. */
export type NotificationDestinationEvent =
  | "error_issue_alert"
  | "site_finding_opened"
  | "site_incident"
  | "site_ai_allowance";

/** Every notification event slug Custd reports on a destination. */
export type NotificationEventSlug =
  | NotificationDestinationEvent
  | "email_relay_test_send"
  | "identity_verify_email"
  | "identity_reset_password"
  | "user_welcome"
  | "application_invitation"
  | "site_status_page_confirm"
  | "site_status_page_update";

export type NotificationChannel = "email" | "webhook" | "slack";

export type NotificationDestination = {
  eventSlug: NotificationEventSlug;
  channel: NotificationChannel;
  enabled: boolean;
  /** False until the tenant saves a destination for this event. */
  configured: boolean;
  emailRecipient?: string;
};

export type NotificationDestinationRequest = {
  channel: NotificationChannel;
  enabled: boolean;
  emailRecipient?: string;
};

export class NotificationDestinationAdminClient {
  constructor(private readonly request: NonAdminRequester) {}

  get(eventSlug: NotificationDestinationEvent, companySlug?: string): Promise<NotificationDestination> {
    return this.request("GET", destinationPath(eventSlug, companySlug));
  }

  put(
    eventSlug: NotificationDestinationEvent,
    body: NotificationDestinationRequest,
    companySlug?: string,
  ): Promise<NotificationDestination> {
    return this.request("PUT", destinationPath(eventSlug, companySlug), body);
  }
}

function destinationPath(eventSlug: string, companySlug?: string): string {
  const path = `/notification-destinations/${encodeURIComponent(eventSlug)}`;
  return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
