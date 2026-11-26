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
export type NotificationWebhookSecret = NotificationWebhookSubscription & {
    signingSecret: string;
};
export type NotificationWebhookListResponse = {
    subscriptions: NotificationWebhookSubscription[];
};
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
export type NotificationDeliveryReplayRequest = {
    reason: string;
};
export declare class NotificationWebhookAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(companySlug?: string): Promise<NotificationWebhookListResponse>;
    create(body: NotificationWebhookCreateRequest): Promise<NotificationWebhookSecret>;
    setEnabled(uuid: string, enabled: boolean, companySlug?: string): Promise<NotificationWebhookSubscription>;
    rotateSecret(uuid: string, companySlug?: string): Promise<NotificationWebhookSecret>;
    delete(uuid: string, companySlug?: string): Promise<void>;
    getDelivery(deliveryUuid: string, companySlug?: string): Promise<NotificationDeliveryStatus>;
    /** Queues the delivery again. */
    replay(deliveryUuid: string, body: NotificationDeliveryReplayRequest, companySlug?: string): Promise<void>;
}
export {};
