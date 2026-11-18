// Alerts on an app item (Admin API /api/v1/app/item/alerts): rules that fire once each time their
// condition becomes true, signed webhooks, the signed-in owner's email subscription, and the
// deliveries they made. Every alert route manages the item, so it needs the owner link or the
// owning user. The JSON names match the routes.
export const APP_ALERT_RULE_TYPES = {
    /** The chance of finishing by the deadline fell below `threshold`. */
    deadlineProbabilityBelow: "deadline_probability_below",
    targetReached: "target_reached",
    /** No new estimate for `staleDays`. */
    estimateStale: "estimate_stale",
    /** The forecast's upper completion bound moved on or before the deadline. */
    forecastMovedInsideTarget: "forecast_moved_inside_target",
};
export const APP_ALERT_CHANNELS = {
    webhook: "webhook",
    email: "email",
};
export const APP_ALERT_DELIVERY_OUTCOMES = {
    pending: "pending",
    sent: "sent",
    failed: "failed",
};
/** Problem codes the alert routes answer with. */
export const APP_ALERT_ERROR_CODES = {
    notFound: "app_alert_not_found",
    /** The item holds as many rules, webhooks or subscriptions as it may. */
    limit: "app_alert_limit",
    /** The signed-in user has no verified email address to send alerts to: verify one first. */
    noVerifiedEmail: "app_alert_no_verified_email",
    /** The user's email address could not be checked right now; retry. */
    emailCheckUnavailable: "app_alert_email_check_unavailable",
    /** The rule's parameters do not match its type. */
    ruleInvalid: "app_alert_rule_invalid",
    /** This deployment cannot deliver webhooks or email right now. */
    deliveryUnavailable: "app_alert_delivery_unavailable",
};
