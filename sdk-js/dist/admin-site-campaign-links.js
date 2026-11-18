// A domain's saved UTM campaign links: a page on the domain's own host tagged
// with utm_* values, kept so staff share the same spelling every time.
// SiteDomainAdminClient sends the calls.
/** A 409 on createCampaignLink: the domain already has an active link with this tagged URL. */
export const SITE_CAMPAIGN_LINK_TAKEN_CODE = "site_campaign_link_taken";
/** A 409 on createCampaignLink: the domain keeps the most active links; archive one first. */
export const SITE_CAMPAIGN_LINK_LIMIT_CODE = "site_campaign_link_limit";
/** How many active campaign links one domain keeps. */
export const SITE_CAMPAIGN_LINKS_MAX = 500;
