// A domain's saved UTM campaign links: a page on the domain's own host tagged
// with utm_* values, kept so staff share the same spelling every time.
// SiteDomainAdminClient sends the calls.

/** A 409 on createCampaignLink: the domain already has an active link with this tagged URL. */
export const SITE_CAMPAIGN_LINK_TAKEN_CODE = "site_campaign_link_taken";
/** A 409 on createCampaignLink: the domain keeps the most active links; archive one first. */
export const SITE_CAMPAIGN_LINK_LIMIT_CODE = "site_campaign_link_limit";

/** How many active campaign links one domain keeps. */
export const SITE_CAMPAIGN_LINKS_MAX = 500;

/**
 * source, medium and campaign are required; term (the paid keyword) and content are optional.
 * Every value is at most 100 characters; the server trims, lower-cases and joins spaces with "_".
 */
export type SiteCampaignLinkRequest = {
  /** The page the link opens, on the domain's own host. */
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
};

/** One saved link; term and content are empty when unset, archivedAt absent while active. */
export type SiteCampaignLink = {
  linkUuid: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  /** The link to share: url with its utm_* parameters. */
  taggedUrl: string;
  createdAt: string;
  archivedAt?: string;
};

/** A domain's links, newest first, and the utm_source and utm_medium names to suggest. */
export type SiteCampaignLinkList = {
  links: SiteCampaignLink[];
  maxLinks: number;
  suggestedSources: string[];
  suggestedMediums: string[];
};
