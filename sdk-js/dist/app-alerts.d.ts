export declare const APP_ALERT_RULE_TYPES: {
    /** The chance of finishing by the deadline fell below `threshold`. */
    readonly deadlineProbabilityBelow: "deadline_probability_below";
    readonly targetReached: "target_reached";
    /** No new estimate for `staleDays`. */
    readonly estimateStale: "estimate_stale";
    /** The forecast's upper completion bound moved on or before the deadline. */
    readonly forecastMovedInsideTarget: "forecast_moved_inside_target";
};
export type AppAlertRuleType = (typeof APP_ALERT_RULE_TYPES)[keyof typeof APP_ALERT_RULE_TYPES];
export declare const APP_ALERT_CHANNELS: {
    readonly webhook: "webhook";
    readonly slack: "slack";
    readonly email: "email";
};
export type AppAlertChannel = (typeof APP_ALERT_CHANNELS)[keyof typeof APP_ALERT_CHANNELS];
export declare const APP_ALERT_DELIVERY_OUTCOMES: {
    readonly pending: "pending";
    readonly sent: "sent";
    readonly failed: "failed";
};
export type AppAlertDeliveryOutcome = (typeof APP_ALERT_DELIVERY_OUTCOMES)[keyof typeof APP_ALERT_DELIVERY_OUTCOMES];
/** Problem codes the alert routes answer with. */
export declare const APP_ALERT_ERROR_CODES: {
    readonly notFound: "app_alert_not_found";
    /** The item holds as many rules, webhooks or subscriptions as it may. */
    readonly limit: "app_alert_limit";
    /** The signed-in user has no verified email address to send alerts to: verify one first. */
    readonly noVerifiedEmail: "app_alert_no_verified_email";
    /** The user's email address could not be checked right now; retry. */
    readonly emailCheckUnavailable: "app_alert_email_check_unavailable";
    /** The rule's parameters do not match its type. */
    readonly ruleInvalid: "app_alert_rule_invalid";
    /** This deployment cannot deliver webhooks or email right now. */
    readonly deliveryUnavailable: "app_alert_delivery_unavailable";
};
/** A rule's type and parameters. */
export type AppAlertRuleSpec = {
    type: AppAlertRuleType;
    /** Chance from 0 to 1 (exclusive); `deadline_probability_below` only. */
    threshold?: number;
    /** Days without a new estimate, 1 to 365; `estimate_stale` only. */
    staleDays?: number;
};
/** One rule and the state it last saw. It fires again only after `conditionMet` clears. */
export type AppAlertRule = AppAlertRuleSpec & {
    ruleUuid: string;
    conditionMet: boolean;
    /** How many times the condition has become true. */
    crossings: number;
    createdAt: string;
};
export type AppAlertWebhookCreateRequest = {
    /** HTTPS URL on port 443 that resolves only to public addresses. */
    endpoint: string;
};
/** How a destination is delivered: signed Custd JSON, or a Slack message. */
export declare const APP_ALERT_DESTINATION_KINDS: {
    readonly webhook: "webhook";
    readonly slack: "slack";
};
export type AppAlertDestinationKind = (typeof APP_ALERT_DESTINATION_KINDS)[keyof typeof APP_ALERT_DESTINATION_KINDS];
export type AppAlertSlackCreateRequest = {
    /** Slack incoming-webhook URL, `https://hooks.slack.com/services/...`. It is the secret: stored sealed, never shown again. */
    webhookUrl: string;
};
/** One destination: a signed webhook or a Slack incoming webhook, whose `endpoint` is only a hint of its URL. */
export type AppAlertWebhook = {
    webhookUuid: string;
    kind: AppAlertDestinationKind;
    endpoint: string;
    createdAt: string;
};
/**
 * A new webhook and its signing secret, shown this once: keep it, Custd cannot. Every delivery is
 * a POST with `X-Custd-Delivery-Id`, `X-Custd-Timestamp` and `X-Custd-Signature: v1=<hex
 * HMAC-SHA256 of "<timestamp>.<body>" under the secret>`.
 */
export type AppAlertWebhookCreated = {
    webhook: AppAlertWebhook;
    signingSecret: string;
};
/** The signed-in user's email subscription; the address is their verified one. */
export type AppAlertSubscription = {
    subscriptionUuid: string;
    createdAt: string;
};
/** Everything an owner manages on the item's alerts. */
export type AppAlertSettings = {
    rules: AppAlertRule[] | null;
    webhooks: AppAlertWebhook[] | null;
    /** The signed-in caller's own subscription; absent when there is none or no one is signed in. */
    subscription?: AppAlertSubscription;
    /** Whether this deployment can deliver webhooks and email at all. */
    deliveryAvailable: boolean;
};
/** One delivery of one rule crossing to one destination. */
export type AppAlertDelivery = {
    /** Matches the webhook's `X-Custd-Delivery-Id`. */
    deliveryUuid: string;
    ruleUuid: string;
    ruleType: AppAlertRuleType;
    crossing: number;
    channel: AppAlertChannel;
    webhookUuid?: string;
    outcome: AppAlertDeliveryOutcome;
    attempts: number;
    lastErrorClass?: string;
    lastStatusCode?: number;
    createdAt: string;
    updatedAt: string;
};
/** The item's newest deliveries, at most 100. */
export type AppAlertDeliveryList = {
    deliveries: AppAlertDelivery[] | null;
};
